import { NextFunction, Request, Response } from 'express';

export default (routeId: number) => (req: Request, res: Response, next: NextFunction): void => {
    req.routeId = routeId;
    next();
};
