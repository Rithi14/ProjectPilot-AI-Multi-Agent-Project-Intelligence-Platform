import api from "./axiosConfig";

export const chatWithAI = (prompt) =>
  api.post("/ai/chat", { prompt });