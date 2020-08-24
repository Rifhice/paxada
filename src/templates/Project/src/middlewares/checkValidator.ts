import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import HttpRequestError from '../exceptions/HttpRequestError';

export default (validators: any[]) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validators.map((validator: any) => validator.run(req)));
    try {
        const errors = validationResult(req);
        if (errors.isEmpty()) return next();
        const errorsId: any = [];
        const content: any = [];
        errors.array().forEach((error: any) => {
            if (!error.msg || !error.msg.code || !error.msg.message) return;
            errorsId.push(error.msg.code);
            content.push(error.msg.message);
        });
        return next(new HttpRequestError(400, errorsId, content));
    } catch (error) /* istanbul ignore next */ {
        return next(error);
    }
};
