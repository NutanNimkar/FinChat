import express from 'express';
import { handleUserQuery } from '../controllers/queryController';
const router = express.Router();

router.post('/summarize', handleUserQuery);

export default router;