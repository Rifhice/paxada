import logger from '@/logger';
import chalk from 'chalk';
import { Express, Request, Response } from 'express';
import moment from 'moment';
import morgan from 'morgan';

export default ({ app }: { app: Express }): void => {
    app.use(
        morgan(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (tokens: any, req: Request, res: Response) => {
                const date = moment().format('MM/DD HH:mm:ss');
                const ip = tokens['remote-addr'](req, res);
                const method = tokens.method(req, res);
                const url = tokens.url(req, res);
                const status = tokens.status(req, res);
                const responseTime = tokens['response-time'](req, res);
                let colorize;
                if (method === 'PUT') colorize = chalk.yellow;
                else if (method === 'POST') colorize = chalk.green;
                else if (method === 'GET') colorize = chalk.blue;
                else if (method === 'DELETE') colorize = chalk.red;
                else colorize = chalk.black;
                return `${date} => ${colorize(`${method} ${url}`)} from ${ip} ended in ${status} in ${responseTime}ms served`;
            },
            { stream: { write: (message) => logger.info(message.replace('\n', '')) } },
        ),
    );
};
