 
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("../middlewares/authMiddleware");

router.get("/", verifyToken, authController.getProfile);
router.put("/", verifyToken, authController.updateProfile);

module.exports = router;
