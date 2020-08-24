import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';

export const sanityzeBody = (keysToKeep: Array<string> | ((body: any) => any)) => (req: Request, res: Response, next: NextFunction): void => {
    req.body = typeof keysToKeep === 'function' ? keysToKeep(req.body) : _.pick(req.body, keysToKeep);
    next();
};

export const sanityzeQuery = (keysToKeep: string[]) => (req: Request, res: Response, next: NextFunction): void => {
    req.query = _.pick(req.query, keysToKeep);
    next();
};
