 
const express = require("express");
const router = express.Router();
const workplaceController = require("../controllers/workplaceController");
const verifyToken = require("../middlewares/authMiddleware");

router.get("/", verifyToken, workplaceController.getAllWorkplaces);
router.get("/:id", verifyToken, workplaceController.getWorkplaceById);
router.post("/", verifyToken, workplaceController.createWorkplace);
router.put("/:id", verifyToken, workplaceController.updateWorkplace);
router.delete("/:id", verifyToken, workplaceController.deleteWorkplace);

module.exports = router;
