const { render } = require("ejs");
const AWS = require("aws-sdk");

const User = require("../models/user");
const Message = require("../models/message");
const s3Storage = require("multer-s3");

const s3 = new AWS.S3();

const listFiles = async () => {
  try {
    const files = await s3
      .listObjectsV2({ Bucket: "cyclic-careful-teal-sturgeon-eu-west-1" })
      .promise();
    const names = files.Contents.map(file => file.Key);
    return { success: true, data: names };
  } catch (error) {
    return { success: false, data: null };
  }
};

const downloadFile = async filename => {
  try {
    const res = await s3
      .getObject({
        Bucket: "cyclic-careful-teal-sturgeon-eu-west-1",
        Key: filename,
      })
      .promise();
    return { success: true, data: res.Body };
  } catch (error) {
    return { success: false, data: error };
  }
};

exports.getUserProfile = (req, res, next) => {
  let successMessage = req.flash("success");
  if (successMessage.length > 0) {
    successMessage = successMessage[0];
  } else {
    successMessage = null;
  }
  const username = req.params.username;
  let user;

  User.findOne({ username: username.toLowerCase() })
    .then(userDoc => {
      if (!userDoc) {
        return res.status(404).render("error/404", {
          pageTitle: "page not found!",
        });
      } else {
        user = userDoc;
      }
    })
    .then(async () => {
      const { success, data } = await downloadFile(user.imageUrl);
      return res.render("profile", {
        pageTitle: "profile",
        success: successMessage,
        user: {
          name: user.name,
          userId: user._id,
          imageUrl: Buffer.from(data).toString("base64"),
        },
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.sendMessage = (req, res, next) => {
  const messageBody = req.body.message;
  const userId = req.body.userId;
  console.log(typeof req.useragent);
  User.findById(userId)
    .then(user => {
      const message = new Message({
        body: messageBody,
        userId: user._id,
        userAgent: req.useragent,
      });
      message.save().then(result => {
        req.flash("success", "Message sent successfuly!");
        return res.redirect(user.username);
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getMessages = async (req, res, next) => {
  const message = await Message.find({ userId: req.session.user._id });
  return res.render("messages", {
    pageTitle: "messages",
    messages: message,
  });
};
