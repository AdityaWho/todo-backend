import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/hello-world/:param', (req: Request, res: Response) => {
  const { param } = req.params;
  res.json({ message: `Hello World, ${param}!` });
});

export default router;
