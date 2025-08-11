 
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  workplace_id: { type: mongoose.Schema.Types.ObjectId, ref: "Workplace", required: true },
  date: { type: Date, required: true },
  status: { type: String, required: true, enum: ["present", "absent", "leave"] },
  wage: { type: Number, required: true },
}, { timestamps: true });

attendanceSchema.index({ employee_id: 1, workplace_id: 1, date: 1 }, { unique: true }); // unique attendance per employee/workplace/date

module.exports = mongoose.model("Attendance", attendanceSchema);
