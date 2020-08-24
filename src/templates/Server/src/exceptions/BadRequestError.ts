import HttpRequestError from './HttpRequestError';

export default class BadRequestError extends HttpRequestError {
    constructor(public errorIds: Array<string | number> | string | number = '000', public message: string = 'Bad request') {
        super(400, errorIds, message);
    }

    toString(): string {
        return this.message;
    }
}
