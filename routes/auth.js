const express = require("express");
const { check } = require("express-validator");

const router = express.Router();

const authController = require("../controllers/auth");
const authValidators = require("../validators/auth");
const authMidlleware = require("../middleware/isAuth");

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post("/login", authValidators.login, authController.postLogin);

router.post("/signup", authValidators.signup, authController.postSignup);

router.post("/logout", authMidlleware, authController.postLogout);

module.exports = router;
