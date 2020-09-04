import logger from '@/logger';
import jwt from 'jwt-simple';
import { Schema } from 'mongoose';
import { SALT_TOKEN } from '../config';

export declare type TokenObject = {
    _id: Schema.Types.ObjectId;
    linkedinId: string;
};

export function encode(data: TokenObject): string {
    return jwt.encode(data, SALT_TOKEN || 'DEFAULT_SALT');
}

export function decode(data: string | null | undefined): TokenObject | false {
    if (!data) return false;
    try {
        return jwt.decode(data, SALT_TOKEN || 'DEFAULT_SALT');
    } catch (e) {
        logger.log('Error while decoding the token : ', data);
        return false;
    }
}
