const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
// Get attendance for a specific date (query param ?date=YYYY-MM-DD)
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date)
      return res.status(400).json({ message: "Date query parameter required" });

    const dateObj = new Date(date);
    const nextDate = new Date(dateObj);
    nextDate.setDate(nextDate.getDate() + 1);

    const records = await Attendance.find({
      owner: req.user.id,
      date: { $gte: dateObj, $lt: nextDate },
    });

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Bulk insert/update attendance records
exports.saveAttendanceRecords = async (req, res) => {
  try {
    const records = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res
        .status(400)
        .json({ message: "Attendance records array required" });
    }

    // Validate records
    for (const rec of records) {
      const { employee_id, workplace_id, date, status, wage } = rec;
      if (
        !employee_id ||
        !workplace_id ||
        !date ||
        !status ||
        wage === undefined
      ) {
        return res
          .status(400)
          .json({ message: "Missing fields in attendance record" });
      }
    }

    // Upsert each record with owner added
    const ops = records.map((rec) => ({
      updateOne: {
        filter: {
          employee_id: rec.employee_id,
          workplace_id: rec.workplace_id,
          date: new Date(rec.date),
          owner: req.user.id, // Add owner to filter too to update only owned records
        },
        update: {
          $set: { ...rec, owner: req.user.id }, // Also set owner on upsert
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(ops);

    res.json({ message: "Attendance saved", attendance: records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// controllers/attendanceController.js

const Loan = require("../models/Loan");
const Deduction = require("../models/Deduction");

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year are required" });
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const empFilter = { owner: req.user.id };
    if (employeeId) empFilter._id = employeeId;
    const employees = await Employee.find(empFilter);

    if (!employees.length) {
      return res.json({ message: "No employees found", data: [] });
    }

    const attendanceRecords = await Attendance.find({
      employee_id: { $in: employees.map((e) => e._id) },
      date: { $gte: startDate, $lte: endDate },
    })
      .populate("employee_id")
      .populate("workplace_id", "name");

    // Fetch all loans & deductions for the month
    const start = startDate.toISOString().split("T")[0]; // 'YYYY-MM-DD'
    const end = endDate.toISOString().split("T")[0];

    const loans = await Loan.find({
      employeeId: { $in: employees.map((e) => e._id) },
      date: { $gte: start, $lte: end },
    });

    const deductions = await Deduction.find({
      employeeId: { $in: employees.map((e) => e._id) },
      date: { $gte: start, $lte: end },
    });

    const allDates = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      allDates.push(new Date(d));
    }

    const summary = {};
    employees.forEach((emp) => {
      const empLoans = loans
        .filter((l) => l.employeeId.equals(emp._id))
        .map((l) => ({ amount: l.amount, remark: l.remark }));

      const empDeductions = deductions
        .filter((d) => d.employeeId.equals(emp._id))
        .map((d) => ({ amount: d.amount, remark: d.remark }));

      const totalLoanAmount = empLoans.reduce((sum, l) => sum + l.amount, 0);
      const totalDeductionAmount = empDeductions.reduce(
        (sum, d) => sum + d.amount,
        0
      );

      summary[emp._id] = {
        employee: emp,
        days: [],
        totalPresent: 0,
        totalAbsent: 0,
        totalWage: 0,
        totalOvertimeWage: 0,
        workplaces: {},
        loans: empLoans,
        deductions: empDeductions,
        totalLoanAmount,
        totalDeductionAmount,
        finalSalary: 0, // will compute later
      };

      allDates.forEach((dateObj) => {
        const rec = attendanceRecords.find(
          (r) =>
            r.employee_id._id.equals(emp._id) &&
            r.date.toISOString().slice(0, 10) ===
              dateObj.toISOString().slice(0, 10)
        );

        let status = "absent";
        let wage = 0;
        let overtimeWage = 0;
        let workplaceName = null;

        if (rec) {
          status = rec.status;
          wage = rec.wage || 0;

          const empWage = emp.wage || 0;
          if (wage > empWage) {
            overtimeWage = wage - empWage;
          }

          if (rec.workplace_id) {
            workplaceName = rec.workplace_id.name || null;
          }

          if (status === "present") summary[emp._id].totalPresent++;
          if (status === "absent") summary[emp._id].totalAbsent++;
        } else {
          summary[emp._id].totalAbsent++;
        }

        summary[emp._id].totalWage += wage;
        summary[emp._id].totalOvertimeWage += overtimeWage;

        if (workplaceName) {
          if (!summary[emp._id].workplaces[workplaceName]) {
            summary[emp._id].workplaces[workplaceName] = 0;
          }
          summary[emp._id].workplaces[workplaceName]++;
        }

        summary[emp._id].days.push({
          date: new Date(dateObj),
          status,
          workplace: workplaceName,
          wage,
          overtimeWage,
        });
      });

      // Final salary after loans & deductions
      summary[emp._id].finalSalary =
        summary[emp._id].totalWage +
        summary[emp._id].totalOvertimeWage -
        totalLoanAmount -
        totalDeductionAmount;
    });

    res.json({ data: Object.values(summary) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
