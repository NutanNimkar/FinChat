import { OpenAI } from "openai";

interface ConversationContext {
  history: { user: string; ai?: string }[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const extractQueryDetails = async (
  query: string,
  context: ConversationContext
): Promise<any> => {
  const conversationHistory = context.history
    .map((msg) => `User: ${msg.user}\nAI: ${msg.ai || ""}`)
    .join("\n");

  const prompt = `
  Given the conversation history below, analyze the latest query and extract relevant details.

    **Conversation History:**  
    ${conversationHistory}

    **Latest User Query:**  
    "${query}"

    **Instructions:**  
    - If the query is a **follow-up question**, infer missing details from the conversation history.
    - If the query is **casual (e.g. "Nice", "Tell me more")**, set "casual": true.
    - Extract details **only if they exist** (e.g. company names, executives, topics, time range, intent).
    - If details are missing, refer to previous responses **but do not assume incorrectly**.
    - If the query is asking for a **specific financial metric** (e.g. "revenue," "profit margin," "net income"), set **intent** to "financial_metrics" and extract the requested metric.
    - Return a **valid JSON object only** in this format:

     If no company is mentioned but executives are listed, infer the companies they are associated with.
     Ensure the response is **valid JSON only** with no extra text.
    {
        "originalQuery": "User's original query",
        "casual": false,
        "isFollowUp": true, 
        "companies": ["Company1"], // Use last mentioned company if missing
        "executives": ["Executive1"],
        "topics": ["Topic1"],
        "timeRange": "latest",
        "financialMetric": "revenue", // Extracted financial metric if present
        "intent": "financial_metrics" or "summarization",
        "conversationHistory": [
            {"user": "Previous user message", "ai": "Previous AI response"}
        ]
    }

    **If the query is casual (e.g., "Okay", "Tell me more"), return:**  
    {
        "originalQuery": "User's original query",
        "casual": true,
        "response": "Sure! Let me know how I can assist further." 
    }

    Query: "${query}"
    **IMPORTANT:**  
    - **DO NOT** include Markdown formatting ("\""\""\"json" or "\"\"\")
    - **DO NOT** include any extra text before or after the JSON.  
    - **Return ONLY the raw JSON.**  
    - **DO NOT summarize or add explanations.**  

    Query: "${query}"
  `;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const rawContent = response.choices[0].message?.content?.trim();
    // console.log("Raw OpenAI Response:", rawContent);

    if (!rawContent) {
      throw new Error("OpenAI returned an empty response.");
    }

    const parsedResponse = JSON.parse(rawContent);
    if (parsedResponse) {
      return parsedResponse;
    }
    // console.log("Extracted JSON:", parsedResponse);

    return parsedResponse;
  } catch (error: any) {
    console.error("Error extracting query details:", error.message);
    return { originalQuery: query, casual: true };
  }
};

const summarizeEarningsCall = async (
  transcript: string,
  query: string,
  company: string,
  ticker: string,
  conversation: string
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

         --- Conversation History ---
          ${conversation}
    
        --- User's query ---
        ${query}
    
        Provide a well-structured and clear response.
        `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // model: 'gpt-3.5-turbo', 
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      // max_tokens: 500,
    });
    return response.choices[0].message?.content || null;
  } catch (error: any) {
    console.error("Error summarizing earnings call:", error.message);
    return null;
  }
};

export { summarizeEarningsCall, extractQueryDetails };
