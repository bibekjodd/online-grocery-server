/* eslint-disable @typescript-eslint/no-empty-object-type */
import { type User as UserProfile } from '@/db/users.schema';

export {};
declare global {
  namespace Express {
    interface User extends UserProfile {}
    interface Request {
      user: UserProfile;
    }
  }
}
