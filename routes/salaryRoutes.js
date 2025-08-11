const express = require("express");
const router = express.Router();
const { getSalarySummary } = require("../controllers/salaryController");
const verifyToken = require("../middlewares/authMiddleware");

router.get("/summary", verifyToken, getSalarySummary);

module.exports = router;
