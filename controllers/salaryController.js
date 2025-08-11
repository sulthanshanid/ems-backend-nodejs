const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Loan = require("../models/Loan");
const Deduction = require("../models/Deduction");

exports.getSalarySummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year are required" });
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    const employees = await Employee.find({ owner: req.user.id });

    if (!employees.length) {
      return res.json([]);
    }

    // Fetch records
    const attendanceRecords = await Attendance.find({
      employee_id: { $in: employees.map((e) => e._id) },
      date: { $gte: startDate, $lte: endDate },
    });

    const loans = await Loan.find({
      employeeId: { $in: employees.map((e) => e._id) },
      date: { $gte: start, $lte: end },
    });

    const deductions = await Deduction.find({
      employeeId: { $in: employees.map((e) => e._id) },
      date: { $gte: start, $lte: end },
    });

    const result = employees.map((emp) => {
      // Attendance salary calc
      let totalWage = 0;
      let totalOvertimeWage = 0;

      attendanceRecords
        .filter((r) => r.employee_id.equals(emp._id))
        .forEach((rec) => {
          const wage = rec.wage || 0;
          totalWage += wage;
          const base = emp.wage || 0;
          if (wage > base) {
            totalOvertimeWage += wage - base;
          }
        });

      // Loans & deductions
      const empLoans = loans.filter((l) => l.employeeId.equals(emp._id));
      const empDeductions = deductions.filter((d) =>
        d.employeeId.equals(emp._id)
      );

      const totalLoanAmount = empLoans.reduce((sum, l) => sum + l.amount, 0);
      const totalDeductionAmount = empDeductions.reduce(
        (sum, d) => sum + d.amount,
        0
      );

      // Final salary
      const finalSalary =
        totalWage /* if totalWage already includes overtime */ -
        totalLoanAmount -
        totalDeductionAmount;

      return {
        employeeId: emp._id,
        name: emp.name,
        totalSalary: totalWage,
        loanDeductions: totalLoanAmount,
        deductions: totalDeductionAmount,
        finalSalary,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
