import { DOCUMENTATION } from '@/config';
import { Express, NextFunction, Request, Response } from 'express';
import * as basicAuth from 'express-basic-auth';
import { convertEntityToOpenApi, convertRouteToOpenApi } from 'mentine';
import { build } from 'sjoa-builder';
import swaggerUi from 'swagger-ui-express';

export default ({ app }: { app: Express }): void => {
    app.use(
        '/api-docs',
        basicAuth.default({
            users: {
                [DOCUMENTATION.USER || 'admin']: DOCUMENTATION.PASSWORD || 'admin',
            },
            challenge: true,
        }),
        swaggerUi.serve,
        async (req: Request, res: Response, next: NextFunction) => {
            const doc = await build({
                baseStructure: {
                    info: {
                        title: 'title',
                        version: 'version',
                    },
                    openapi: '3.0.0',
                    paths: {},
                    components: {
                        schemas: {},
                    },
                },
                routes: {
                    globs: ['dist/routes/**/*.js'],
                    converter: convertRouteToOpenApi,
                },
                schemas: {
                    globs: ['dist/entities/**/*.js'],
                    converter: convertEntityToOpenApi,
                },
            });
            swaggerUi.setup(doc)(req, res, next);
        },
    );
};
