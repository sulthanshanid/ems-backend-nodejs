require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
// after your other app.use() calls
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));
app.use("/api/deductions", require("./routes/deductionRoutes"));
app.use("/api/loans", require("./routes/loanRoutes"));
app.use("/api/workplaces", require("./routes/workplaceRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/salary", require("./routes/salaryRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
