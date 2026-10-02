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

/* ========================= */
/* ROUTES */
/* ========================= */

app.use("/documents", documentRoutes);
app.use("/rag", ragRoutes);

app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/chat", chatRoutes);

app.use("/tasks", taskRoutes);
app.use("/agents", agentRoutes);

app.use("/ai", aiRoutes);
app.use("/ai", aiTaskRoutes);

app.use("/risk", riskRoutes);
app.use("/multi-agent", multiAgentRoutes);
app.use("/meetings", meetingRoutes);
app.use("/project-ai", projectAiRoutes);
app.use("/ai/recommendations", aiRecommendationRoutes);

/* ========================= */
/* HOME ROUTE */
/* ========================= */

app.get("/", (req, res) => {
    res.json({
        status: "success",
        message: "AI MultiAgent Project Manager Backend Running Successfully"
    });
});

/* ========================= */
/* 404 */
/* ========================= */

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found"
    });
});

/* ========================= */
/* SERVER */
/* ========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("=====================================");
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log("=====================================");
});