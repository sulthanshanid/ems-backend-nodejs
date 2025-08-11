@echo off
REM Create folder structure
mkdir config
mkdir controllers
mkdir middlewares
mkdir models
mkdir routes
mkdir utils

REM Create main files
echo. > server.js
echo. > .env
echo. > package.json

REM Config files
echo. > config\db.js

REM Controllers
echo. > controllers\authController.js
echo. > controllers\employeeController.js
echo. > controllers\deductionController.js
echo. > controllers\loanController.js
echo. > controllers\workplaceController.js
echo. > controllers\attendanceController.js
echo. > controllers\profileController.js

REM Middlewares
echo. > middlewares\authMiddleware.js

REM Models
echo. > models\User.js
echo. > models\Employee.js
echo. > models\Deduction.js
echo. > models\Loan.js
echo. > models\Workplace.js
echo. > models\Attendance.js
echo. > models\Profile.js

REM Routes
echo. > routes\authRoutes.js
echo. > routes\employeeRoutes.js
echo. > routes\deductionRoutes.js
echo. > routes\loanRoutes.js
echo. > routes\workplaceRoutes.js
echo. > routes\attendanceRoutes.js
echo. > routes\profileRoutes.js

REM Utils
echo. > utils\helpers.js

echo Folder structure and files created successfully.
pause
