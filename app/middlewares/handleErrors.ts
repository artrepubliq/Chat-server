import { Request, Response } from 'express';
export const handle404Errors = (req: Request, res: Response) => {
    res.status(404).json({ status: false, message: 'Please Check URL' });
}