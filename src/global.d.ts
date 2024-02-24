import { EnvType } from '@/config/env.config';
import { UserSnapshot } from './schemas/user.schema';

export {};
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvType {
      //
    }
  }

  namespace Express {
    interface User extends UserSnapshot {}
    interface Request {
      user: UserSnapshot;
    }
  }
}
