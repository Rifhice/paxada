#!/usr/bin/env ts-node-script
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
/* eslint-disable import/first */
require('module-alias/register');

import { NODE_ENV, PORT, WEB_CONCURRENCY } from '@/config';
import { init } from '@/loaders/index';
import logger from '@/logger';
import cluster from 'cluster';
import express, { Express } from 'express';
import { Server } from 'http';

const asyncAwaitListen = (app: Express, port: string): Promise<Server> => {
    return new Promise<Server>((resolve) => {
        const server = app.listen(port, async () => {
            logger.debug(`API is now listening on port ${port}`);
            resolve(server);
        });
    });
};

const startServer = async (port: string): Promise<{ app: Express; server: Server }> => {
    const app = express();
    const server = await asyncAwaitListen(app, port);
    await init({ app, server });
    return { app, server };
};

if (cluster.isMaster && NODE_ENV !== `test`) {
    const numWorkers = WEB_CONCURRENCY || 1;
    logger.debug(`Master cluster setting up ${numWorkers} workers....`);

    for (let i = 0; i < numWorkers; i += 1) {
        cluster.fork();
    }

    cluster.on(`online`, (worker) => {
        logger.debug(`Worker ${worker.process.pid} is online`);
    });

    cluster.on(`exit`, (worker, code, signal) => {
        logger.debug(`Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);
        logger.debug(`Starting a new worker`);
        cluster.fork();
    });
} else {
    startServer(PORT);
}
