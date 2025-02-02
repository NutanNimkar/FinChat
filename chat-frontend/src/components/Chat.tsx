import React, { useState } from "react";
import axios from "axios";
import styles from "./Chat.module.css";

interface Message {
  role: "user" | "ai";
  content: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear input
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:4050/api/openai/summarize", {
        message: input,
      });
      const aiMessage: Message = { role: "ai", content: response.data.reply };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
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
              {msg.content}
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
          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
