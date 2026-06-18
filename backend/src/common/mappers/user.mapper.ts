import type { PublicUser } from '../types/chat';

/**
 * Minimal shape every user mapper needs. Both a hydrated `UserDocument` and the
 * lean `PublicUserRow` (from `findAll`) satisfy this structurally.
 */
export interface PublicUserSource {
  _id: string;
  name: string;
  email: string;
}

export function toPublicUser(source: PublicUserSource): PublicUser {
  return {
    id: source._id,
    name: source.name,
    email: source.email,
  };
}
