const Deduction = require("../models/Deduction");

// Get all deductions
exports.getAllDeductions = async (req, res) => {
  try {
    const deductions = await Deduction.find({ owner: req.user.id });
    res.json(deductions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get deduction by ID
exports.getDeductionById = async (req, res) => {
  try {
    const { id } = req.params;
    const deduction = await Deduction.findById({ _id: id, owner: req.user.id });
    if (!deduction)
      return res.status(404).json({ message: "Deduction not found" });
    res.json(deduction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new deduction
exports.createDeduction = async (req, res) => {
  try {
    const { employeeId, amount, remark, date } = req.body;
    if (!employeeId || !amount || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newDeduction = new Deduction({
        owner: req.user.id,
      employeeId,
      amount,
      remark: remark || "",
      date,
    });

    await newDeduction.save();
    res.json({ message: "Deduction added", deduction: newDeduction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update deduction
exports.updateDeduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, amount, remark, date } = req.body;

    const deduction = await Deduction.findById({ _id: id, owner: req.user.id });
    if (!deduction)
      return res.status(404).json({ message: "Deduction not found" });

    if (employeeId) deduction.employeeId = employeeId;
    if (amount != null) deduction.amount = amount;
    deduction.remark = remark || "";
    if (date) deduction.date = date;

    await deduction.save();
    res.json({ message: "Deduction updated", deduction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete deduction
exports.deleteDeduction = async (req, res) => {
  try {
    const { id } = req.params;
    const deduction = await Deduction.findByIdAndDelete({ _id: id, owner: req.user.id });
    if (!deduction)
      return res.status(404).json({ message: "Deduction not found" });
    res.json({ message: "Deduction deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
