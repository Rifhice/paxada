// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

export const NODE_ENV = process.env.NODE_ENV as 'production' | 'development' | 'test' | undefined;

export const { WEB_CONCURRENCY, SALT_TOKEN, REDIS_URL } = process.env;

export const PORT = process.env.PORT || '5000';

export const MONGO = {
    URI: process.env.MONGODB_URI,
    URI_TEST: process.env.MONGODB_URI_TEST,
};

export const DOCUMENTATION = {
    USER: process.env.DOCUMENTATION_USER,
    PASSWORD: process.env.DOCUMENTATION_PASSWORD,
};
