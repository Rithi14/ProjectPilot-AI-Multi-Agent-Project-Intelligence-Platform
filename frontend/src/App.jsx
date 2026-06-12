import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import AIChat from "./pages/AIChat";
import MultiAgent
from "./pages/MultiAgent"
import Analytics from "./pages/Analytics"
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin-dashboard" element={<Dashboard />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="/documents" element={<Documents />}/>
        <Route
  path="/multi-agent"
  element={<MultiAgent />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;