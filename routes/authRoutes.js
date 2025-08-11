 
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("../middlewares/authMiddleware");

// Signup
router.post("/signup", authController.signup);

// Login
router.post("/login", authController.login);

// Validate token (protected)
router.get("/validate-token", verifyToken, authController.validateToken);
router.get("/verify-token", verifyToken, (req, res) => {
  // If this middleware passes, token is valid
  res.json({ valid: true });
});
module.exports = router;
