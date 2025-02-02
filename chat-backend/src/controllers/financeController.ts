import { Request, Response } from "express";
import { getCurrentQuarter } from "../utils/date";
import axios from "axios";

const API_KEY = process.env.FMP_API_KEY;

const fetchEarningsCallData = async (
  ticker: string,
  year: number,
  quarter: number
): Promise<string | null> => {
  console.log(
    `Fetching earnings call for ${ticker}, Year: ${year}, Quarter: ${quarter}`
  );

  try {
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/earning_call_transcript/${ticker}?year=${year}&quarter=${quarter}&apikey=${API_KEY}`
    );

    const transcriptData = response.data;

    if (!transcriptData || transcriptData.length === 0) {
      console.log(
        `No earnings call transcript found for ${ticker}, Year: ${year}, Quarter: ${quarter}`
      );
      return null;
    }

    return transcriptData[0].content;
  } catch (error: any) {
    console.error(
      "Error fetching earnings call:",
      error.response?.data || error.message
    );
    return null;
  }
};

const fetchEarningsWithContext = async (
  ticker: string,
  timeRange: string
): Promise<string[]> => {
  const { year, quarter } = getCurrentQuarter();
  let earningsCalls: string[] = [];
  let currentYear = year;
  let currentQuarter = quarter;

//   console.log(`Fetching earnings for ${ticker} with time range: ${timeRange}`);

  // Check if time range is multiple quarters
  const isMultipleQuarters =
    timeRange.toLowerCase().includes("last") ||
    timeRange.toLowerCase().includes("few") ||
    timeRange.toLowerCase().includes("past") ||
    timeRange.toLowerCase().includes("previous") ||
    timeRange.toLowerCase().includes("two") ||
    timeRange.toLowerCase().includes("three") ||
    timeRange.toLowerCase().includes("four");
  let attempts = 0;
  const maxAttempts = isMultipleQuarters ? 4 : 8; // Stop after 8 quarters (2 years) to prevent infinite loop

  while (attempts < maxAttempts) {
    // console.log(
    //   `Checking earnings call for ${ticker}, Year: ${currentYear}, Quarter: ${currentQuarter}`
    // );

    const transcript = await fetchEarningsCallData(
      ticker,
      currentYear,
      currentQuarter
    );
    if (transcript) {
      earningsCalls.push(transcript);
    //   console.log(
    //     `Found earnings call for ${ticker} in ${currentYear} Q${currentQuarter}!`
    //   );

      if (!isMultipleQuarters) break; // Stop if we only need the latest one
    } else {
      console.log(
        `No transcript of earnings call found for ${ticker} in ${currentYear} Q${currentQuarter}, checking previous quarter...`
      );
    }

    // Roll back to the previous quarter
    if (currentQuarter === 1) {
      currentQuarter = 4;
      currentYear -= 1;
    } else {
      currentQuarter -= 1;
    }

    attempts += 1;
  }

  if (earningsCalls.length === 0) {
    console.log(
      `No earnings call found for ${ticker} after checking the last ${attempts} quarters.`
    );
  }

  return earningsCalls;
};

// Aliases for common company names to improve accuracy
const COMPANY_ALIASES: { [key: string]: string } = {
  google: "Alphabet Inc.",
  alphabet: "Alphabet Inc.",
  microsoft: "Microsoft Corporation",
  amazon: "AMAZON",
  meta: "META",
  tesla: "Tesla Inc.",
  nvidia: "NVIDIA Corporation",
  amd: "Advanced Micro Devices Inc.",
  apple: "Apple Inc.",
  netflix: "Netflix Inc.",
  uber: "UBER",
  lyft: "Lyft Inc.",
};

const getTickersFromCompanyNames = async (
  companyNames: string[] | string
): Promise<{ [key: string]: string }> => {

  let companyTickerMap: { [key: string]: string } = {}; // map to store company names and their corresponding tickers

  if (typeof companyNames === "string") {
    companyNames = [companyNames];
  }
  for (const company of companyNames) {
    console.log(`Fetching ticker for company: ${company}`);

    let normalizedCompanyName =
      COMPANY_ALIASES[company.toLowerCase()] || company;

    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/search?query=${normalizedCompanyName}&apikey=${API_KEY}`
    );

    const searchResults = response.data;

    if (Array.isArray(searchResults) && searchResults.length > 0) {
      const filteredResults = searchResults.filter((result: any) =>
        ["NASDAQ", "NYSE"].includes(result.exchangeShortName)
      );

      if (filteredResults.length > 0) {
        const ticker = filteredResults[0].symbol;
        // console.log(`Found ticker: ${ticker} for company: ${company}`);
        companyTickerMap[company] = ticker;
      }
    //   console.log(companyTickerMap);
    }
  }

  return companyTickerMap;
};

//for single company testing
// const getTickerFromCompanyName = async (companyName: string): Promise<string | null> => {
//     try {
//         console.log(`Fetching ticker for company: ${companyName}`);
//         const response = await axios.get(`https://financialmodelingprep.com/api/v3/search?query=${companyName}&apikey=${API_KEY}`);
//         const searchResults = response.data;

//         if (!searchResults || searchResults.length === 0) {
//             console.log(`No ticker found for company: ${companyName}`);
//             return null;
//         }
//         const filteredResults = searchResults.filter((result: any) =>
//             ["NASDAQ", "NYSE"].includes(result.exchangeShortName)
//         );
//         return filteredResults[0].symbol;
//     } catch (error: any) {
//         console.error("Error fetching ticker:", error.response?.data || error.message);
//         return null;
//     }
// };

const fetchEarningsCallController = async (req: Request, res: Response) => {
  const { ticker } = req.params;
  const { timeRange } = req.query;

  if (!ticker) {
    res.status(400).json({ error: "No ticker provided" });
    return;
  }

  try {
    const earningCallsTranscript = await fetchEarningsWithContext(
      ticker,
      timeRange ? String(timeRange) : "latest"
    );

    if (earningCallsTranscript.length === 0) {
      res.status(404).json({ error: "No transcript found" });
      return;
    } 

    res.status(200).json({ data: earningCallsTranscript });
  } catch (error: any) {
    console.error(
      "Error fetching earnings call:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Error fetching earnings call data" });
  }
};

const getTickerController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { company } = req.params;

  if (!company) {
    res.status(400).json({ error: "No company name provided" });
    return;
  }

  const ticker = await getTickersFromCompanyNames(company);

  if (!ticker) {
    res
      .status(404)
      .json({ error: "No ticker found for the provided company" });
    return;
  }

  res.status(200).json({ ticker });
};
export {
  fetchEarningsCallController,
  fetchEarningsCallData,
  getTickerController,
  getTickersFromCompanyNames,
  fetchEarningsWithContext,
};
