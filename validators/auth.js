const { body } = require("express-validator");
const User = require("../models/user");

exports.signup = [
  body("name")
    .trim()
    .isAlphanumeric("en-US", { ignore: " " })
    .withMessage("Please use only English letters."),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please Enter a valid email.")
    .custom((value, { req }) => {
      User.findOne({ email: value }).then(user => {
        if (user) {
          return Promise.reject(
            "E-Mail exists already, please pick a diffrent one."
          );
        }
      });
    })
    .normalizeEmail(),

  body("password")
    .trim()
    .isLength({ min: 5, max: 62 })
    .withMessage(
      "Please Enter a password with at least 5 character and less than 60 charcter long."
    ),

  body("confirmPassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords have to match!.");
      }
      return true;
    }),
];

exports.login = [
  body("email").trim().isEmail().withMessage("Please Enter a valid email."),

  body("password")
    .isLength({ min: 5, max: 62 })
    .withMessage(
      "Please Enter a password with at least 5 character and less than 60 charcter long."
    ),
];
