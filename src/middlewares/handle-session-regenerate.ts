import { RequestHandler } from 'express';

export const handleSessionRegenerate: RequestHandler = (req, res, next) => {
  if (req.session && !req.session.regenerate) {
    // @ts-expect-error ...
    req.session.regenerate = (cb) => {
      cb(undefined);
    };
  }
  if (req.session && !req.session.save) {
    // @ts-expect-error ...
    req.session.save = (cb) => {
      if (cb) cb(undefined);
    };
  }
  next();
};
