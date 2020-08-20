import HttpRequestError from './HttpRequestError';

export default class NotFoundRequestError extends HttpRequestError {
    constructor(public errorIds: Array<string | number> | string | number = '000', public message: string = 'Not found') {
        super(404, errorIds, message);
    }

    toString(): string {
        return this.message;
    }
}
