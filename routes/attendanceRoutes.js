 
const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const verifyToken = require("../middlewares/authMiddleware");

router.get("/", verifyToken, attendanceController.getAttendanceByDate);
router.post("/", verifyToken, attendanceController.saveAttendanceRecords);
// routes/attendanceRoutes.js
const { getAttendanceSummary } = require("../controllers/attendanceController");


router.get("/summary", verifyToken, getAttendanceSummary);

module.exports = router;


