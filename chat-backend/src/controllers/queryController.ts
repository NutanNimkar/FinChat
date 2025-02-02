import { Request, Response } from "express";
import { extractQueryDetails, summarizeEarningsCall } from "./openAIController";
import {
  getTickersFromCompanyNames,
  fetchEarningsWithContext,
} from "./financeController";

const handleUserQuery = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      res.status(400).json({ error: "No query provided" });
      return;
    }

    // Step 1: Extract query details (multiple companies)
    const details = await extractQueryDetails(query);
    if (!details || !details.companies || details.companies.length === 0) {
      res.status(400).json({ error: "No companies mentioned in the query" });
      return;
    }

    // Step 2: Fetch tickers for all mentioned companies
    const companyTickers = await getTickersFromCompanyNames(details.companies);

    let results: { company: string; ticker: string; summary: string | null }[] =
      [];

    for (const [company, ticker] of Object.entries(companyTickers)) {
      console.log(`Processing summary for ${company} (${ticker})`);

      // Step 3: Fetch earnings call transcript
      const earningsCalls = await fetchEarningsWithContext(
        ticker,
        details.timeRange || "latest"
      );
      if (earningsCalls.length === 0) {
        console.log(`No earnings call data found for ${company}`);
        continue;
      }

      // Step 4: Summarize earnings call
      const summary = await summarizeEarningsCall(
        earningsCalls.join("\n\n"),
        query,
        company,
        ticker
      );

      results.push({ company, ticker, summary });
    }

    res.status(200).json({ results });
  } catch (error: any) {
    console.error("Error handling user query:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
export { handleUserQuery };
