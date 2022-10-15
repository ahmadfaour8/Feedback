const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");

const User = require("../models/user");

async function isAvailable(username) {
  try {
    const user = await User.findOne({ username });
    console.log("user : " + user);
    if (user) {
      return isAvailable(username + Math.floor(Math.random() * 101));
    } else {
      return username;
    }
  } catch (error) {
    console.log(error);
  }
}

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    pageTitle: "signup",
    errorMessage: message,
  });
};

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    pageTitle: "Login",
    errorMessage: message,
  });
};

exports.postSignup = async (req, res, next) => {
  const { name, email, password } = req.body;
  const image = req.file;
  const imageUrl = image.key;
  const errors = validationResult(req);
  console.log("this is errors" + errors);
  const username = await isAvailable(name.replace(/\s/g, "-").toLowerCase());

  try {
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(422).render("auth/signup", {
        pageTitle: "signup",
        errorMessage: errors.array()[0].msg,
      });
    }

    if (!image) {
      return res.status(422).render("auth/signup", {
        pageTitle: "signup",
        errorMessage: "Attached file is not an image.",
      });
    }

    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(422).render("auth/signup", {
        pageTitle: "signup",
        errorMessage: "Email already exists!.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = User.create({
      name,
      username,
      email,
      password: hashedPassword,
      imageUrl,
    });
    console.log(result);

    res.redirect("/login");
  } catch (error) {
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("auth/login", {
      pageTitle: "login",
      errorMessage: errors.array()[0].msg,
    });
  }

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/login");
      }
      bcrypt.compare(password, user.password).then(doMatch => {
        if (doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(err => {
            console.log(err);
            res.redirect("/");
          });
        }
        req.flash("error", "Invalid email or password");
        return res.redirect("/login");
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  return req.session.destroy(err => {
    console.log(err);
    res.redirect("/");
  });
};
