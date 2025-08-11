const Loan = require("../models/Loan");

// Get all loans
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ owner: req.user.id });
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get loan by ID
exports.getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById({ _id: id, owner: req.user.id });
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    res.json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new loan
exports.createLoan = async (req, res) => {
  try {
    const { employeeId, amount, remark, date } = req.body;
    if (!employeeId || !amount || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newLoan = new Loan({
        owner: req.user.id,
      employeeId,
      amount,
      remark: remark || "",
      date,
    });

    await newLoan.save();
    res.json({ message: "Loan added", loan: newLoan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update loan
exports.updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, amount, remark, date } = req.body;

    const loan = await Loan.findById({ _id: id, owner: req.user.id });
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    if (employeeId) loan.employeeId = employeeId;
    if (amount != null) loan.amount = amount;
    loan.remark = remark || "";
    if (date) loan.date = date;

    await loan.save();
    res.json({ message: "Loan updated", loan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete loan
exports.deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findByIdAndDelete({ _id: id, owner: req.user.id });
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    res.json({ message: "Loan deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
