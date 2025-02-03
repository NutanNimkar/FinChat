import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import financeRoutes from "./routes/finance";
import openAi from "./routes/openAI";

const app = express();
const PORT = process.env.PORT;

app.use(cors({
    origin: "http://localhost:3000", // ✅ Replace with frontend URL
    methods: ["GET", "POST"],
    credentials: true
}));

app.use(express.json());

app.use("/api/finance", financeRoutes);
app.use("/api/openai", openAi);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
