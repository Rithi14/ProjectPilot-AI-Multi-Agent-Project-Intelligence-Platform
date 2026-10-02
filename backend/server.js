require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const aiRoutes = require("./routes/aiRoutes");
const aiTaskRoutes = require("./routes/aiTaskRoutes");
const riskRoutes = require("./routes/riskRoutes");
const agentRoutes = require("./routes/agentRoutes");
const ragRoutes = require("./routes/ragRoutes");
const documentRoutes = require("./routes/documentRoutes");
const multiAgentRoutes = require("./routes/multiAgentRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const projectAiRoutes = require("./routes/projectAiRoutes");
const chatRoutes = require("./routes/chatRoutes");
const aiRecommendationRoutes = require("./routes/aiRecommendationRoutes");

const app = express();

/* ========================= */
/* MIDDLEWARE */
/* ========================= */

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://project-pilot-ai-multi-agent-projec.vercel.app"
    ],
    credentials: true
}));

app.use(express.json());