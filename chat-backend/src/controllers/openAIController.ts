import { OpenAI } from "openai";
import { raw, Request, Response } from "express";
import nlp from "compromise";
import {
  fetchEarningsCallData,
  getTickersFromCompanyNames,
} from "./financeController";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to extract the company name from the query

// const extractCompanyName = (query: string): string | null => {
//     const doc = nlp(query);

//     const organizations = doc.organizations().out("array");

//     if (organizations.length > 0) {
//         const firstCompany = organizations[0].split(" ")[0];
//         return firstCompany;
//     }

//     return null;
// };

// Function to extract query details
const extractQueryDetails = async (query: string): Promise<any> => {
  const prompt = `
    Extract the following details from the query:
    - Company names mentioned in the query (e.g., Apple, Spotify).
    - Executives mentioned in the query (e.g., Mark Zuckerberg, Satya Nadella, Tim Cook, Jeff Bezos).
    - Topics mentioned in the query (e.g., AI, profitability).
    - Time range (e.g., latest, last quarter, last few earnings calls).
    - Intent (e.g., summarization, financial metrics).

    If no company is mentioned but executives are listed, infer the companies they are associated with.
    Ensure the response is **valid JSON only** with no extra text.


    Query: "${query}"

    Respond in **valid JSON format** without additional text. Use this format exactly:
    {
        "companies": ["Company1"],
        "executives": ["Executive1"],
        "topics": ["Topic1"],
        "timeRange": "latest",
        "intent": "summarization"
    }
    `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const rawContent = response.choices[0].message?.content?.trim();
    console.log("Raw OpenAI Response:", rawContent);

    if (!rawContent) {
      throw new Error("OpenAI returned an empty response.");
    }
    console.log("Extracted JSON:", JSON.parse(rawContent));
    return JSON.parse(rawContent);
  } catch (error: any) {
    console.error("Error extracting query details:", error.message);
    return null;
  }
};

const summarizeEarningsCall = async (
  transcript: string,
  query: string,
  company: string,
  ticker: string
): Promise<string | null> => {
  try {
    const prompt = `
        Below is the transcript of the latest earnings call for ${company} (${ticker}). 
        Answer the user's query concisely based on the transcript.
    
        --- Transcript ---
        ${transcript.slice(
          0,
          4000
        )}  // Trim transcript to 4000 characters to avoid token limit
    
        --- User's query ---
        ${query}
    
        Provide a well-structured and clear response.
        `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    // const response = await openai.chat.completions.create({
    //     model: 'gpt-3.5-turbo',  // Uses a cheaper, token-efficient model
    //     messages: [{ role: 'user', content: prompt }],
    //     temperature: 0.7,
    //     max_tokens: 500,
    // });

    return response.choices[0].message?.content || null;
  } catch (error: any) {
    console.error("Error summarizing earnings call:", error.message);
    return null;
  }
};

export { summarizeEarningsCall, extractQueryDetails };
