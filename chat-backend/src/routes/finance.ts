import express from "express";
import {
  fetchEarningsCallController,
  getTickerController,
} from "../controllers/financeController";

const router = express.Router();

router.get("/earningscall/:ticker", fetchEarningsCallController);
router.get("/ticker/:company", getTickerController);

export default router;
