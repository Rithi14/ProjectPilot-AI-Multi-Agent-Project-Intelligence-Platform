const chatModel = require("../models/chatModel");

// Create New Chat
exports.createChat = async (req, res) => {
  try {
    const chatId = await chatModel.createChat(req.body.title);

    res.json({
      success: true,
      chatId,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Chats
exports.getChats = async (req, res) => {
  try {
    const chats = await chatModel.getChats();

    res.json(chats);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Messages
exports.getMessages = async (req, res) => {
  try {
    const messages = await chatModel.getMessages(req.params.id);

    res.json(messages);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Save Message
exports.saveMessage = async (req, res) => {
  try {
    const { chatId, role, message } = req.body;

    await chatModel.saveMessage(chatId, role, message);

    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// Pin / Unpin Chat
exports.pinChat = async (req, res) => {

  try {

    const { pinned } = req.body;

    await chatModel.pinChat(
      req.params.id,
      pinned
    );

    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};
exports.renameChat = async (req, res) => {

  try {

    await chatModel.renameChat(
      req.params.id,
      req.body.title
    );

    res.json({
      success: true
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};

// Delete Chat
exports.deleteChat = async (req, res) => {
  try {
    await chatModel.deleteChat(req.params.id);

    res.json({
      success: true,
    });
  } catch (err) {
  console.error("CHAT ERROR:", err);

  res.status(500).json({
    success: false,
    message: err.message,
  });
}
};