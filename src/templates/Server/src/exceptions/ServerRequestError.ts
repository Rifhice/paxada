import HttpRequestError from './HttpRequestError';

export default class ServerRequestError extends HttpRequestError {
    constructor(public errorIds: Array<string | number> | string | number = '000', public message: string = 'Internal Error') {
        super(500, errorIds, message);
    }

    toString(): string {
        return this.message;
    }
}
