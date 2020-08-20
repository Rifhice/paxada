export default class HttpRequestError extends Error {
    constructor(
        public status: number = 500,
        public errorIds: Array<string | number> | string | number = '000',
        public message: string = 'Internal Error',
    ) {
        super();
    }

    toString(): string {
        return this.message;
    }
}
