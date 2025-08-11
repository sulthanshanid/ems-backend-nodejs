const moment = require("moment-timezone");
const Workplace = require("../models/Workplace");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

exports.getStats = async (req, res) => {
  try {
    const workplaces = await Workplace.find({ owner: req.user.id }).lean();
    res.render("stats", { workplaces });
  } catch (err) {
    res.status(500).send("Error fetching workplaces.");
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
      { $unwind: "$workplace" },
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
          _id: "$workplace._id",
          workplace_name: { $first: "$workplace.name" },
          presentEmployees: {
            $push: {
              $cond: [
                { $eq: ["$status", "present"] },
                {
                  employee_id: "$employee._id",
                  name: "$employee.name",
                  basic_wage: "$employee.basic_wage",
                  overtime_wage: "$overtime_wage",
                  total_daily_wage: "$wage",
                },
                "$$REMOVE",
              ],
            },
          },
          absentEmployees: {
            $push: {
              $cond: [
                { $eq: ["$status", "absent"] },
                {
                  employee_id: "$employee._id",
                  name: "$employee.name",
                  basic_wage: "$employee.basic_wage",
                  overtime_wage: 0,
                  total_daily_wage: "$wage",
                },
                "$$REMOVE",
              ],
            },
          },
          totalSalary: { $sum: "$wage" },
        },
      },
      {
        $project: {
          workplace_name: 1,
          presentCount: { $size: "$presentEmployees" },
          absentCount: { $size: "$absentEmployees" },
          total: {
            $add: [
              { $size: "$presentEmployees" },
              { $size: "$absentEmployees" },
            ],
          },
          presentEmployees: 1,
          absentEmployees: 1,
          totalSalary: 1,
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

    // Calculate overall totals
    const totals = data.reduce(
      (acc, workplace) => {
        acc.totalPresent += workplace.presentCount;
        acc.totalAbsent += workplace.absentCount;
        acc.totalSalary += workplace.totalSalary;
        return acc;
      },
      { totalPresent: 0, totalAbsent: 0, totalSalary: 0 }
    );

    res.json({
      date: moment().tz("Asia/Dubai").format("YYYY-MM-DD"),
      workplaces: data,
      totals,
    });
  } catch (err) {
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
