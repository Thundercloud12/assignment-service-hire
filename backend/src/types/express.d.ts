import type { IAuthTokenPayload } from '../interfaces/IUser';

declare global {
  namespace Express {
    interface Request {
      user?: IAuthTokenPayload;
    }
  }
}

export {};