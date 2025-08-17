 
const Workplace = require("../models/Workplace");

// Get all workplaces
exports.getAllWorkplaces = async (req, res) => {
  try {
    const workplaces = await Workplace.find({  owner: req.user.id });
    res.json(workplaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get workplace by ID
exports.getWorkplaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const workplace = await Workplace.findById({ _id: id, owner: req.user.id });
    if (!workplace) return res.status(404).json({ message: "Workplace not found" });
    res.json(workplace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new workplace
exports.createWorkplace = async (req, res) => {
  try {
    const { name,location } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Workplace name is required" });
    }

    const newWorkplace = new Workplace({ name: name.trim(), owner: req.user.id,location: location.trim() });
    await newWorkplace.save();

    res.json({ message: "Workplace added", workplace: newWorkplace });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update workplace
exports.updateWorkplace = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const { location } = req.body;  

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Workplace name is required" });
    }

    const workplace = await Workplace.findById({ _id: id, owner: req.user.id });
    if (!workplace) return res.status(404).json({ message: "Workplace not found" });

    workplace.name = name.trim();
    workplace.location = location ? location.trim() : workplace.location; // Update location only if provided
    await workplace.save();

    res.json({ message: "Workplace updated", workplace });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete workplace
exports.deleteWorkplace = async (req, res) => {
  try {
    const { id } = req.params;
    const workplace = await Workplace.findByIdAndDelete({ _id: id, owner: req.user.id });
    if (!workplace) return res.status(404).json({ message: "Workplace not found" });
    res.json({ message: "Workplace deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
