/* eslint-disable no-nested-ternary */
import HttpRequestError from '@/exceptions/HttpRequestError';
import addLeadingCharacter from '@/helpers/addLeadingCharacter';
import logger from '@/logger';
import * as ErrorStackParser from 'error-stack-parser';
import { Express, NextFunction, Request, Response } from 'express';

export default ({ app }: { app: Express }): void => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        const parsed = ErrorStackParser.parse(err);
        const first = parsed.shift();
        if (err instanceof HttpRequestError) {
            const fileType = first?.fileName?.includes('checkValidator.js')
                ? 'V'
                : first?.fileName?.includes('.route.js')
                ? 'R'
                : first?.fileName?.includes('middlewares')
                ? 'M'
                : 'U';
            const errorCodes =
                err.errorIds instanceof Array
                    ? `-${err.errorIds
                          .map<string>((errorId: string | number) => addLeadingCharacter(errorId, 3))
                          .join('-')}`
                    : `-${addLeadingCharacter(err.errorIds, 3)}`;
            const errorFormatted = `${fileType}${addLeadingCharacter(req.routeId, 3)}${err.status}${errorCodes}`;
            return res.status(err.status).send({ code: errorFormatted, message: err.message });
        }
        logger.error(err);
        return res.status(500).send('Internal error');
    });
};
