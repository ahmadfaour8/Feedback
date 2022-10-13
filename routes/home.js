const express = require("express")
const router = express.Router()

const authHome = require("../controllers/home")

router.get("/", authHome.getHome)

router.get("/about", authHome.getAbout)

module.exports = router
