#!/usr/bin/env ts-node-script
/* eslint-disable import/first */
require('module-alias/register');

import { NODE_ENV, PORT, WEB_CONCURRENCY } from '@/config';
import { startServer } from '@/loaders/index';
import logger from '@/logger';
import cluster from 'cluster';

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
