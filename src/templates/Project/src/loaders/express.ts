import bodyParser from 'body-parser';
import cors from 'cors';
import { Express } from 'express';
import bearerToken from 'express-bearer-token';
import helmet from 'helmet';

export default ({ app }: { app: Express }): void => {
    app.use(cors());
    app.use(helmet());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(bearerToken());
};
