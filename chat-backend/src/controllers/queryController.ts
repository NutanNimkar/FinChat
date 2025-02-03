import { Request, Response } from "express";
import { extractQueryDetails, summarizeEarningsCall } from "./openAIController";
import {
  getTickersFromCompanyNames,
  fetchEarningsWithContext,
  fetchFinancialMetric,
} from "./financeController";

const handleUserQuery = async (req: Request, res: Response) => {
  try {
    const { query, conversation = [], mentionedCompanies = [] } = req.body;

    if (!query) {
      res.status(400).json({ error: "No query provided" });
      return;
    }

    // Step 1: Extract query details
    const details = await extractQueryDetails(query, { history: conversation });

    if (details.casual) {
      res.status(200).json({ response: details.response });
      return;
    }

    // ✅ If no company is mentioned, reuse last mentioned company
    if (!details.companies || details.companies.length === 0) {
      if (mentionedCompanies.length > 0) {
        details.companies = [mentionedCompanies[mentionedCompanies.length - 1]];
      }
    }

    if (!details.companies || details.companies.length === 0) {
      res
        .status(200)
        .json({ response: "Which company's financial data would you like?" });
      return;
    }

    let responseMessages: string[] = [];
    const companyTickers = await getTickersFromCompanyNames(details.companies);

    // ✅ Handle financial metric queries
    if (details.intent === "financial_metrics" && details.financialMetric) {
      console.log(
        `Fetching financial metric for ${
          companyTickers[details.companies[0]]
        } (${details.financialMetric})`
      );
      const financialData = await fetchFinancialMetric(
        companyTickers[details.companies[0]],
        details.financialMetric
      );
      if (financialData) {
        responseMessages.push(financialData);
      }
    }

    // ✅ Handle earnings call transcript summaries
    if (details.intent === "summarization") {
      for (const [company, ticker] of Object.entries(companyTickers)) {
        console.log(`Processing summary for ${company} (${ticker})`);

        const earningsCalls = await fetchEarningsWithContext(
          ticker,
          details.timeRange || "latest"
        );
        if (!earningsCalls || earningsCalls.length === 0) {
          responseMessages.push(
            `No earnings call data available for ${company} (${ticker}).`
          );
          continue;
        }

        const reply = await summarizeEarningsCall(
          earningsCalls.join("\n\n"),
          query,
          company,
          ticker,
          conversation
        );
        responseMessages.push(reply || "No summary found");
      }
    }

    res
      .status(200)
      .json({
        results: responseMessages,
        mentionedCompanies: details.companies,
      });
  } catch (error: any) {
    console.error("Error handling user query:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
export { handleUserQuery };
