import logger from '@/logger';
import { RedisAdapter } from 'socket.io-redis';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const redis = require('socket.io-redis');

export default (url: string): Promise<RedisAdapter> =>
    new Promise<RedisAdapter>((resolve, reject) => {
        const redisAdapter: RedisAdapter = redis(url);
        redisAdapter.pubClient.on('error', reject);
        redisAdapter.pubClient.on('connect', () => {
            logger.info('Connected to redis');
            resolve(redisAdapter);
        });
    });
