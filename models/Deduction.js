const mongoose = require("mongoose");

const deductionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    amount: { type: Number, required: true },
    remark: { type: String, default: "" },
    date: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          // Basic YYYY-MM-DD format check
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid date format (YYYY-MM-DD)!`,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deduction", deductionSchema);
