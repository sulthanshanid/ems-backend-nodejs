 
const Employee = require("../models/Employee");

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ owner: req.user.id });
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, jobTitle, wage,status } = req.body;
    if (!name || !jobTitle || wage == null) {
      return res.status(400).json({ message: "Name, role and wage are required" });
    }

    const newEmployee = new Employee({ owner: req.user.id,name, role:jobTitle, wage,status });
    await newEmployee.save();
    res.json({ message: "Employee added", employee: newEmployee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, wage,status } = req.body;
    const employee = await Employee.findById( {owner: req.user.id ,_id:id});
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    if (name) employee.name = name;
    if (role) employee.role = role;
    if (wage != null) employee.wage = wage;
    if (status) employee.status = status;
    await employee.save();
    res.json({ message: "Employee updated", employee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOneAndDelete({ _id: id, owner: req.user.id });

    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
