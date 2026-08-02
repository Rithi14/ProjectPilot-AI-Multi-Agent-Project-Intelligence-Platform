const db = require("../config/db");

// Create Chat
function createChat(title = "New Chat") {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO ai_chats(title) VALUES(?)",
      [title],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      }
    );
  });
}

// Get Chats
function getChats() {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM ai_chats ORDER BY updated_at DESC",
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

// Get Messages
function getMessages(chatId) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM ai_messages WHERE chat_id=? ORDER BY created_at ASC",
      [chatId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

// Save Message
function saveMessage(chatId, role, message) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO ai_messages(chat_id,role,message) VALUES(?,?,?)",
      [chatId, role, message],
      (err) => {
        if (err) return reject(err);

        db.query(
          "UPDATE ai_chats SET updated_at=NOW() WHERE id=?",
          [chatId],
          (err2) => {
            if (err2) return reject(err2);
            resolve(true);
          }
        );
      }
    );
  });
}
// Pin / Unpin Chat
function pinChat(chatId, pinned) {

  return new Promise((resolve, reject) => {

    db.query(
      "UPDATE ai_chats SET pinned=? WHERE id=?",
      [pinned, chatId],
      (err) => {

        if (err) return reject(err);

        resolve(true);

      }
    );

  });

}
// Rename Chat
function renameChat(chatId, title) {

  return new Promise((resolve, reject) => {

    db.query(
      "UPDATE ai_chats SET title=? WHERE id=?",
      [title, chatId],
      (err) => {

        if (err) return reject(err);

        resolve(true);

      }
    );

  });

}

// Delete Chat
// Delete Chat
function deleteChat(chatId) {

  return new Promise((resolve, reject) => {

    db.query(
      "DELETE FROM ai_messages WHERE chat_id=?",
      [chatId],
      (err) => {

        if (err) return reject(err);

        db.query(
          "DELETE FROM ai_chats WHERE id=?",
          [chatId],
          (err2) => {

            if (err2) return reject(err2);

            resolve(true);

          }
        );

      }
    );

  });

}

module.exports = {
  createChat,
  getChats,
  getMessages,
  saveMessage,
  pinChat,
  renameChat,
  deleteChat,
};