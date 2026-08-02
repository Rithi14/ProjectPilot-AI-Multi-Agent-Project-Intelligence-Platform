const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chatController");

router.post("/create", chatController.createChat);

router.get("/", chatController.getChats);

router.get("/:id", chatController.getMessages);

router.post("/message", chatController.saveMessage);
router.put("/:id/pin", chatController.pinChat);
router.put("/:id", chatController.renameChat);

router.delete("/:id", chatController.deleteChat);

module.exports = router;