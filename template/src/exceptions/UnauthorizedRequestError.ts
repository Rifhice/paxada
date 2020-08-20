import HttpRequestError from './HttpRequestError';

export default class UnauthorizedRequestError extends HttpRequestError {
    constructor(public errorIds: Array<string | number> | string | number = '000', public message: string = 'Unauthorized') {
        super(401, errorIds, message);
    }

    toString(): string {
        return this.message;
    }
}
