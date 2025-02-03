# FinChat

A conversational AI chatbot that allows users to query earnings call transcripts and get concise, structured responses. The application uses OpenAI's GPT model to provide insightful summaries, powered by financial data from the **Financial Modeling Prep (FMP) API**.

---

## **Technologies Used**
### **Frontend**
- React.js (with TypeScript)
- Axios for API requests
- TailwindCSS for styling

### **Backend**
- Node.js with Express.js
- TypeScript
- OpenAI API for natural language processing
- Financial Modeling Prep (FMP) API for financial data

---

## **Setup and Installation**

1. **Clone the repository**
   ```bash
      git clone https://github.com/NutanNimkar/FinChat.git
   ```
2. **Frontend**
  ```bash
      cd chat-frontend
      Use a node version >= 20, I am using 22.13.0
      nvm install 22.13.0
      nvm use 22.13.0
      npm install
      npm install --legacy-peer-deps (if react version problems are caused)
  ```
3. **Backend**
  ```bash
    cd chat-backend
    npm install
    npm run dev
  ```
4. **Create a .env in chat-backend folder**
  ```bash
    OPENAI_API_KEY=your_openai_api_key
    FMP_API_KEY=your_fmp_api_key
    PORT=4050
 ```
