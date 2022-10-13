const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");
const authMidlleware = require("../middleware/isAuth");

router.post("/sendMessage", userController.sendMessage);

router.get("/messages", authMidlleware, userController.getMessages);

router.get("/:username", userController.getUserProfile);

module.exports = router;
