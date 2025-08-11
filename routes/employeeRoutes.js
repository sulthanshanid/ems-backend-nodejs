 const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const verifyToken = require("../middlewares/authMiddleware");

router.get("/", verifyToken, employeeController.getAllEmployees);
router.post("/", verifyToken, employeeController.createEmployee);
router.put("/:id", verifyToken, employeeController.updateEmployee);
router.delete("/:id", verifyToken, employeeController.deleteEmployee);

module.exports = router;

