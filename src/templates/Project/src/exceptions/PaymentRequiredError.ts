import HttpRequestError from './HttpRequestError';

export default class PaymentRequiredError extends HttpRequestError {
    constructor(public errorIds: Array<string | number> | string | number = '000', public message: string = 'Payment required') {
        super(402, errorIds, message);
    }

    toString(): string {
        return this.message;
    }
}
