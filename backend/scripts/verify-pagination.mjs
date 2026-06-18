// Phase 8 verification: cursor pagination over a 100+ message thread.
// Run against a server started on BASE (default http://localhost:3099).
const BASE = process.env.BASE ?? 'http://localhost:3099';
const TOTAL = 120;
const LIMIT = 20;

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  }
  return json;
}

const stamp = Date.now();
const signup = (n) =>
  api('/auth/signup', {
    method: 'POST',
    body: {
      email: `pag_${stamp}_${n}@example.com`,
      password: 'password123',
      name: `Pager ${n}`,
    },
  });

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERT FAILED: ' + msg);
}

const a = await signup('a');
const b = await signup('b');

const { conversation } = await api('/conversations', {
  method: 'POST',
  token: a.token,
  body: { title: 'Pagination thread', participantIds: [b.user.id] },
});
const cid = conversation.id;

for (let i = 0; i < TOTAL; i++) {
  await api(`/conversations/${cid}/messages`, {
    method: 'POST',
    token: a.token,
    body: { body: `msg-${String(i).padStart(3, '0')}` },
  });
}

const pages = [];
let cursor;
for (let guard = 0; guard < 100; guard++) {
  const q = new URLSearchParams({ limit: String(LIMIT) });
  if (cursor) q.set('cursor', cursor);
  const page = await api(`/conversations/${cid}/messages?${q.toString()}`, {
    token: a.token,
  });
  pages.push(page);
  // within-page ascending by createdAt
  for (let i = 1; i < page.messages.length; i++) {
    assert(
      page.messages[i - 1].createdAt <= page.messages[i].createdAt,
      `within-page order broke at page ${pages.length}, idx ${i}`,
    );
  }
  if (!page.nextCursor) break;
  cursor = page.nextCursor;
}

// Oldest->newest reconstruction: newest page came first.
const full = [...pages].reverse().flatMap((p) => p.messages);

const ids = new Set(full.map((m) => m.id));
const bodies = new Set(full.map((m) => m.body));

assert(full.length === TOTAL, `expected ${TOTAL} messages, got ${full.length}`);
assert(ids.size === TOTAL, `duplicate ids detected (${ids.size} unique)`);
assert(bodies.size === TOTAL, `duplicate/missing bodies (${bodies.size})`);
for (let i = 0; i < TOTAL; i++) {
  assert(
    bodies.has(`msg-${String(i).padStart(3, '0')}`),
    `missing msg-${i}`,
  );
}
for (let i = 1; i < full.length; i++) {
  assert(
    full[i - 1].createdAt <= full[i].createdAt,
    `global order broke at idx ${i}`,
  );
}
assert(full.every((m) => m.status === 'sent'), 'status not "sent"');
assert(full.every((m) => m.id && !('_id' in m)), '_id leaked into DTO');
assert(
  pages.length === Math.ceil(TOTAL / LIMIT),
  `expected ${Math.ceil(TOTAL / LIMIT)} pages, got ${pages.length}`,
);
assert(
  pages[pages.length - 1].nextCursor === null,
  'last page nextCursor should be null',
);
assert(pages[0].messages.length === LIMIT, 'first page should be full');

console.log(
  `PASS: ${full.length} messages across ${pages.length} pages, ` +
    `ascending, unique, status=sent, terminal nextCursor=null.`,
);
