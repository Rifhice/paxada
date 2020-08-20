import { NODE_ENV } from '@/config';
import logger from '@/logger';
import { Server } from 'http';
import socketio from 'socket.io';
import { RedisAdapter } from 'socket.io-redis';

let io: socketio.Server | null = null;

export const listen = (server: Server, redisAdapter: RedisAdapter): void => {
    try {
        io = socketio(server, {
            pingTimeout: 5000,
            pingInterval: 10000,
            transports: ['websocket'],
        });
        io.adapter(redisAdapter);
        io.on('connection', (socket) => {
            socket.on('error', (error: any) => {
                logger.error(error);
            });

            socket.on('disconnect', () => {
                if (NODE_ENV === 'development') logger.info(`A client is disconnected ( id: ${socket.id} )`);
            });
        });
        io.on('error', (error: any) => {
            logger.error(error);
        });
    } catch (error) {
        logger.error(error);
    }
};

export const broadcast = (event: string, channelId: string, data: any): void => {
    try {
        if (!io) return;
        io.to(channelId).emit(event, data);
    } catch (error) {
        logger.error(error);
    }
};
