 
const express = require("express");
const router = express.Router();
const deductionController = require("../controllers/deductionController");
const verifyToken = require("../middlewares/authMiddleware");

router.get("/", verifyToken, deductionController.getAllDeductions);
router.get("/:id", verifyToken, deductionController.getDeductionById);
router.post("/", verifyToken, deductionController.createDeduction);
router.put("/:id", verifyToken, deductionController.updateDeduction);
router.delete("/:id", verifyToken, deductionController.deleteDeduction);

module.exports = router;
