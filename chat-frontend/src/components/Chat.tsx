import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import axios from "axios";
import styles from "./Chat.module.css";

interface Message {
  role: "user" | "ai";
  content: string;
}
// type AIReply = {
//   reply: string;
//   company?: string;
// };
const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    { user: string; ai?: string }[]
  >([]);
  const [mentionedCompanies, setMentionedCompanies] = useState<string[]>([]);

  useEffect(() => {
    console.log(messages);
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Step 1: Send query with conversation history
      const response = await axios.post(
        "http://localhost:4050/api/openai/summarize",
        {
          query: input,
          conversation: conversationHistory,
          mentionedCompanies,
        }
      );

      console.log(response.data);

      if (response.data.response) {
        const casualMessage: Message = {
          role: "ai",
          content: response.data.response,
        };
        setMessages((prev) => [...prev, casualMessage]);
        setLoading(false);
        return;
      }
      console.log(response.data.results);
      //
      if (response.data.results && Array.isArray(response.data.results)) {
        // const aiReplies: AIReply[] = response.data.results.map(
        //   (result: any) => ({
        //     reply: result.reply as string,
        //     company: result.company as string | undefined | null,
        //   })
        // );

        if (response.data.results && Array.isArray(response.data.results)) {
          response.data.results.forEach((reply: string) => {
            // Format the AI reply
            // const formattedReply = reply
            //   .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold text
            //   .replace(/- (.*?)\n/g, "<li>$1</li>") // Bullet points
            //   .replace(/(\d+\..*?)\n/g, "<h3>$1</h3>") // Numbered headings
            //   .replace(/\n\n/g, "<br /><br />"); // Line breaks
            //conversation history for next request
            setConversationHistory((prev) => [
              ...prev,
              { user: input, ai: reply },
            ]);
            // Add AI reply to messages
            const aiMessage: Message = { role: "ai", content: reply };
            setMessages((prev) => [...prev, aiMessage]);

          });

          // mentioned companies for next request
          if (
            response.data.mentionedCompanies &&
            Array.isArray(response.data.mentionedCompanies)
          ) {
            setMentionedCompanies(response.data.mentionedCompanies);
          }
        }
      }
    } catch (error) {
      console.error("Error processing request:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.chat}>
      <div className={styles["chat-container"]}>
        <div className={styles.messages}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`${styles.message} ${
                msg.role === "user" ? styles.user : styles.ai
              }`}
              >
              <Markdown>{msg.content}</Markdown>
            </div>
          ))}
          {loading && <div className={styles.loading}>Thinking...</div>}
        </div>
        <form onSubmit={handleSubmit} className={styles["input-form"]}>
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.button} disabled={loading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
