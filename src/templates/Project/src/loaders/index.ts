import { MONGO, NODE_ENV, REDIS_URL } from '@/config';
import logger from '@/logger';
import routes from '@/routes';
import express, { Express } from 'express';
import { Server } from 'http';
import documentation from './documentation';
import errorHandler from './errorHandler';
import setupExpress from './express';
import setupLogger from './logger';
import { disconnectFromDatabase, loginToDatabase } from './mongoose';
import redis from './redis';
import { listen } from './socket';

export const close = async (): Promise<void> => {
    await disconnectFromDatabase();
};

export const init = async ({ app, server }: { app: Express; server: Server }): Promise<void> => {
    // Setup basic middlewares
    setupExpress({ app });

    // Setup logger for requests
    if (NODE_ENV === 'development') setupLogger({ app });

    // Setup documentation (openApi)
    documentation({ app });

    // Setup redis connection
    const redisAdapter = await redis(REDIS_URL || '');

    // Setup socket.io server
    listen(server, redisAdapter);

    // Setup mongoose connection
    await loginToDatabase((NODE_ENV === 'test' && MONGO.URI_TEST) || MONGO.URI || '');

    app.use('/api', routes);

    // Setup error handler for requests
    errorHandler({ app });

    server.on('close', close);
    server.emit('ready');
};

const asyncAwaitListen = (app: Express, port: string): Promise<Server> => {
    return new Promise<Server>((resolve) => {
        const server = app.listen(port, async () => {
            logger.debug(`API is now listening on port ${port}`);
            resolve(server);
        });
    });
};

export const startServer = async (port: string): Promise<{ app: Express; server: Server }> => {
    const app = express();
    const server = await asyncAwaitListen(app, port);
    await init({ app, server });
    return { app, server };
};
