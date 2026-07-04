import type { PublicUser } from '../../common/types/chat';

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
