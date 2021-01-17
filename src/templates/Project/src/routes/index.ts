import BadRequestError from '@/exceptions/BadRequestError';
import routeId from '@/middlewares/routeId';
import express, { Request, Response } from 'express';

const router = express.Router({ mergeParams: true });

router.get('/healthcheck', routeId(0), (req: Request, res: Response) => res.send({ alive: true }));
router.get('/', routeId(1), (req: Request, res: Response) => res.send('Hello world!'));
router.get('/error', routeId(2), () => {
    throw new BadRequestError(['1', '2'], 'Error');
});

export default router;
