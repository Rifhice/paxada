import { NODE_ENV } from '@/config';
import logger from '@/logger';
import mongoose from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

mongoose.Promise = Promise;

export function loginToDatabase(uri: string): Promise<void> {
    // Connect to Mongoose
    mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    return new Promise((resolve, reject) => {
        mongoose.connection
            .once('open', async () => {
                logger.info(`Connected to ${NODE_ENV === 'test' ? 'test' : ''} mongoDB`);
                resolve();
            })
            .on('error', (error: Error) => {
                logger.error('Connection error:', error);
                reject();
            });
    });
}

export function disconnectFromDatabase(): Promise<void> {
    return mongoose.disconnect();
}

export const dropDatabase = async (): Promise<void> =>
    NODE_ENV === 'test' && mongoose.connection.db.databaseName.includes('Test') && mongoose.connection.db.dropDatabase();
