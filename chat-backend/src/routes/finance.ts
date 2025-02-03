import express from "express";
import {
  fetchEarningsCallController,
  getTickerController,
  getFinancialMetricController
} from "../controllers/financeController";

const router = express.Router();

router.get("/earningscall/:ticker", fetchEarningsCallController);
router.get("/ticker/:company", getTickerController);
router.get("/metric/:ticker/:metric", getFinancialMetricController);

export default router;
