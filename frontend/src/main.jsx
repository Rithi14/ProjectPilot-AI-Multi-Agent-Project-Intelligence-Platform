import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import "./index.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AIChat from "./pages/AIChat";
import Documents from "./pages/Documents";
import MultiAgent from "./pages/MultiAgent";
import MeetingHistory from "./pages/MeetingHistory";
import Analytics from "./pages/Analytics";

ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <BrowserRouter>

      <Routes>

        {/* LOGIN */}

        <Route
          path="/"
          element={<Login />}
        />

        {/* ADMIN DASHBOARD */}

        <Route
          path="/admin-dashboard"
          element={<Dashboard />}
        />

        {/* AGENT DASHBOARD */}

        <Route
          path="/agent-dashboard"
          element={<AgentDashboard />}
        />

        {/* AI CHAT */}

        <Route
          path="/ai-chat"
          element={<AIChat />}
        />

        {/* DOCUMENTS */}

        <Route
          path="/documents"
          element={<Documents />}
        />

        {/* MULTI AGENT */}

        <Route
          path="/multi-agent"
          element={<MultiAgent />}
        />

        {/* MEETING HISTORY */}

        <Route
          path="/meeting-history"
          element={<MeetingHistory />}
        />

        {/* ANALYTICS */}

        <Route
          path="/analytics"
          element={<Analytics />}
        />

      </Routes>

    </BrowserRouter>

  </React.StrictMode>

);