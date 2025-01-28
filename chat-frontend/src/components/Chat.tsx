import React, { useEffect, useState } from "react";
import "./Chat.module.css";
import axios from "axios";

const Chat = () => {
  const [inputMessages, setInputMessages] = useState([]);
  const [outputMessages, setOutputMessages] = useState([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Hello');
  }

  return (
    <div className="chat">
      <div className="chat-container">
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            placeholder="Type your message here"
            required
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
};
export default Chat;
