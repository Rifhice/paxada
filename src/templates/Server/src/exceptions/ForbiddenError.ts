import HttpRequestError from './HttpRequestError';

export default class ForbiddenRequestError extends HttpRequestError {
    constructor(public errorIds: Array<string | number> | string | number = '000', public message: string = 'Forbidden') {
        super(403, errorIds, message);
    }

    toString(): string {
        return this.message;
    }
}
