import { MONGO, NODE_ENV, REDIS_URL } from '@/config';
import routes from '@/routes';
import { Express } from 'express';
import { Server } from 'http';
import documentation from './documentation';
import errorHandler from './errorHandler';
import express from './express';
import logger from './logger';
import { disconnectFromDatabase, loginToDatabase } from './mongoose';
import redis from './redis';
import { listen } from './socket';

export const close = async (): Promise<void> => {
    await disconnectFromDatabase();
};

export const init = async ({ app, server }: { app: Express; server: Server }): Promise<void> => {
    // Setup basic middlewares
    express({ app });

    // Setup logger for requests
    if (NODE_ENV === 'development') logger({ app });

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
