const axios = require("axios");

const aiClient = axios.create({
  baseURL: "http://localhost:8000"
});

module.exports = aiClient;