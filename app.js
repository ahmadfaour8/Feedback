require("dotenv").config();
const path = require("path");
const fs = require("fs");

const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const userAgent = require("express-useragent");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const app = express();
const store = new MongoDBStore({
  uri: process.env.DATABASE_URL,
  collection: "session",
});
const csrfProtection = csrf();

app.set("view engine", "ejs");
app.set("views", "views");

const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const homeRouter = require("./routes/home");
const errorController = require("./controllers/error");

const s3 = new AWS.S3();

// const fileStorge = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "images");
//   },
//   filename: (req, file, cb) => {
//     cb(
//       null,
//       new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
//     );
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (
//     file.mimetype === "image/png" ||
//     file.mimetype === "image/jpg" ||
//     file.mimetype === "image/jpeg"
//   ) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

app.use(bodyParser.urlencoded({ extended: false }));
// app.use(
//   multer({ storage: fileStorge, fileFilter: fileFilter }).single("image")
// );
app.use(
  multer({
    storage: multerS3({
      s3: s3,
      bucket: "cyclic-careful-teal-sturgeon-eu-west-1",
      key: (req, file, cb) => {
        cb(null, Date.now().toString());
      },
    }),
  }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// const accessLogStream = fs.createWriteStream(
//   path.join(__dirname, "access.log"),
//   { flags: "a" }
// );

// app.use(morgan("combined", { stream: accessLogStream }));
app.use(compression());
app.use(helmet());
app.use(csrfProtection);
app.use(flash());
app.use(userAgent.express());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  res.locals.user = req.session.user ? req.session.user : null;
  next();
});

app.use("/user", userRouter);
app.use(authRouter);
app.use(homeRouter);

app.get("/500", errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render("error/500", {
    pageTitle: "Error!",
    isAuthenticated: req.session.isLoggedIn ? true : false,
  });
});

mongoose
  .connect(process.env.DATABASE_URL)
  .then(result => {
    app.listen(process.env.PORT || 3000);
  })
  .catch(err => {
    console.log(err);
  });
