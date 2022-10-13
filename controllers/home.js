exports.getHome = (req, res, next) => {
  res.render("index", { pageTitle: "Feedback" })
}

exports.getAbout = (req, res, next) => {
  res.render("about", { pageTitle: "about" })
}
