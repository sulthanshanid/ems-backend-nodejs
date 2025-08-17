const moment = require("moment-timezone");
const Workplace = require("../models/Workplace");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

// Dummy example data source; replace with your DB/model query
const activityLog = [
  {
    id: 1,
    userId: 123,
    user: "John Doe",
    action: "Marked attendance",
    timestamp: new Date(Date.now() - 7200000),
    status: "success",
  }, // 2h ago
  {
    id: 2,
    userId: 123,
    user: "Sarah Roy",
    action: "Added wage slip",
    timestamp: new Date(Date.now() - 21600000),
    status: "info",
  }, // 6h ago
  {
    id: 3,
    userId: 456,
    user: "Mike Ross",
    action: "Updated profile",
    timestamp: new Date(Date.now() - 3600000),
    status: "warning",
  }, // 1h ago
];

exports.getRecentActivity = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Filter by user (owner) — replace with your DB query
    const userActivities = activityLog;

    // Format time using moment-timezone, e.g. "2h ago"
    const activities = userActivities.map((item) => ({
      id: item.id,
      user: item.user,
      action: item.action,
      time: moment(item.timestamp).fromNow(),
      status: item.status,
    }));

    res.json(activities);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Total employees under owner
    const totalEmployees = await Employee.countDocuments({ owner: ownerId });

    // Employee IDs under owner
    const employeeIds = await Employee.find({ owner: ownerId }).distinct("_id");

    // Current year date range (UTC)
    const currentYear = moment.utc().year();
    const yearStart = moment.utc([currentYear, 0, 1]).startOf("day").toDate();
    const yearEnd = moment.utc([currentYear, 11, 31]).endOf("day").toDate();

    // Monthly wages aggregation
    const monthlyWagesAgg = await Attendance.aggregate([
      {
        $match: {
          employee_id: { $in: employeeIds },
          date: { $gte: yearStart, $lte: yearEnd },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$date" } },
          wage: { $sum: "$wage" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);
    console.log("Monthly Wages Aggregation:", monthlyWagesAgg);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthlyWages = monthlyWagesAgg.map((m) => ({
      month: monthNames[m._id.month - 1],
      wage: m.wage,
    }));

    // Today range (UTC)
    const todayStart = moment.utc().startOf("day").toDate();
    const todayEnd = moment.utc().endOf("day").toDate();

    // Present count for today
    const presentAgg = await Attendance.aggregate([
      {
        $match: {
          employee: { $in: employeeIds },
          date: { $gte: todayStart, $lte: todayEnd },
          status: "Present", // adjust if your status values differ
        },
      },
      {
        $group: {
          _id: null,
          presentCount: { $sum: 1 },
        },
      },
    ]);

    const present = presentAgg.length > 0 ? presentAgg[0].presentCount : 0;
    const absent = totalEmployees - present;

    res.json({
      success: true,
      monthlyWages,
      today: { present, absent },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getStats = async (req, res) => {
  try {
    const ownerId = req.user.id; // set by auth middleware
    console.log("Owner ID:", ownerId);

    // 1️⃣ Count total employees under this owner
    const totalEmployees = await Employee.countDocuments({ owner: ownerId });
    const totalWorkplaces = await Workplace.countDocuments({ owner: ownerId });
    // 2️⃣ Get start & end of current year in UTC
    const currentYear = moment.utc().year();
    const yearStart = moment.utc([currentYear, 0, 1]).startOf("day").toDate(); // Jan 1 UTC
    const yearEnd = moment.utc([currentYear, 11, 31]).endOf("day").toDate(); // Dec 31 UTC

    // 3️⃣ Get employee IDs under this owner
    const employeeIds = await Employee.find({ owner: ownerId }).distinct("_id");

    // 4️⃣ Sum wages for those employees in the current year
    const wageResult = await Attendance.aggregate([
      {
        $match: {
          employee_id: { $in: employeeIds },
          date: {
            $gte: yearStart,
            $lte: yearEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalWage: { $sum: "$wage" },
        },
      },
    ]);

    const totalWage = wageResult.length > 0 ? wageResult[0].totalWage : 0;

    res.json({
      success: true,
      data: {
        totalEmployees,
        totalWage,
        totalWorkplaces,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===== TODAY GROUPED BY WORKPLACE =====
exports.getStatsToday = async (req, res) => {
  try {
    const startOfDay = moment().tz("Asia/Dubai").startOf("day").toDate();
    const endOfDay = moment().tz("Asia/Dubai").endOf("day").toDate();

    const workingEmployees = await Employee.find({ owner: req.user.id }).lean();
    const workingIds = workingEmployees.map((e) => e._id);

    const data = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay },
          employee_id: { $in: workingIds },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employee_id",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $lookup: {
          from: "workplaces",
          localField: "workplace_id",
          foreignField: "_id",
          as: "workplace",
        },
      },
      { $unwind: { path: "$workplace", preserveNullAndEmptyArrays: true } }, // allow null workplace
      {
        $addFields: {
          overtime_wage: {
            $cond: [
              { $gt: ["$wage", "$employee.basic_wage"] },
              { $subtract: ["$wage", "$employee.basic_wage"] },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            workplace: "$workplace._id", // group by workplace
            employee: "$employee._id", // and by employee, so multiple entries are kept
          },
          workplace_name: { $first: "$workplace.name" },
          employee: { $first: "$employee" },
          records: {
            $push: {
              status: "$status",
              wage: "$wage",
              overtime_wage: "$overtime_wage",
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id.workplace",
          workplace_name: { $first: "$workplace_name" },
          employees: {
            $push: {
              employee_id: "$employee._id",
              name: "$employee.name",
              basic_wage: "$employee.basic_wage",
              records: "$records",
            },
          },
        },
      },
    ]);

    if (!data.length) {
      return res.json({
        message: "Attendance not recorded for today.",
        workplaces: [],
        totals: { totalPresent: 0, totalAbsent: 0, totalSalary: 0 },
      });
    }

    // Format to include present / absent lists
    const workplaces = data.map((workplace) => {
      const presentEmployees = [];
      const absentEmployees = [];
      let totalSalary = 0;

      workplace.employees.forEach((emp) => {
        emp.records.forEach((rec) => {
          totalSalary += rec.wage;

          if (rec.status === "present") {
            presentEmployees.push({
              employee_id: emp.employee_id,
              name: emp.name,
              basic_wage: emp.basic_wage,
              overtime_wage: rec.overtime_wage,
              total_daily_wage: rec.wage,
            });
          } else {
            absentEmployees.push({
              employee_id: emp.employee_id,
              name: emp.name,
              basic_wage: emp.basic_wage,
              overtime_wage: 0,
              total_daily_wage: rec.wage,
            });
          }
        });
      });

      return {
        workplace_name: workplace.workplace_name,
        presentCount: presentEmployees.length,
        absentCount: absentEmployees.length,
        total: presentEmployees.length + absentEmployees.length,
        presentEmployees,
        absentEmployees,
        totalSalary,
      };
    });

    // Calculate overall totals
    const totals = workplaces.reduce(
      (acc, w) => {
        acc.totalPresent += w.presentCount;
        acc.totalAbsent += w.absentCount;
        acc.totalSalary += w.totalSalary;
        return acc;
      },
      { totalPresent: 0, totalAbsent: 0, totalSalary: 0 }
    );

    res.json({
      date: moment().tz("Asia/Dubai").format("YYYY-MM-DD"),
      workplaces,
      totals,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ===== WEEKLY STATS WITH TOTAL SALARY =====
exports.getStatsWeekly = async (req, res) => {
  try {
    const startDate = moment()
      .tz("Asia/Dubai")
      .subtract(6, "days")
      .startOf("day")
      .toDate();
    const endDate = moment().tz("Asia/Dubai").endOf("day").toDate();

    const workingEmployees = await Employee.find({
      owner: req.user.id,
    }).distinct("_id");

    const data = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          employee_id: { $in: workingEmployees },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: "Asia/Dubai",
            },
          },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          totalSalary: { $sum: "$wage" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const last7Days = Array.from({ length: 7 }).map((_, i) =>
      moment()
        .tz("Asia/Dubai")
        .subtract(6 - i, "days")
        .format("YYYY-MM-DD")
    );

    const dataMap = {};
    data.forEach((d) => {
      dataMap[d._id] = {
        date: d._id,
        present: d.present,
        absent: d.absent,
        totalSalary: d.totalSalary,
      };
    });

    const finalData = last7Days.map((date) => ({
      date,
      present: dataMap[date]?.present || 0,
      absent: dataMap[date]?.absent || 0,
      total: (dataMap[date]?.present || 0) + (dataMap[date]?.absent || 0),
      totalSalary: dataMap[date]?.totalSalary || 0,
    }));

    res.json(finalData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
