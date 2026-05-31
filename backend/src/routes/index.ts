import { Router } from "express";
import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import studentsRoutes from "./students.routes.js";
import visitsRoutes from "./visits.routes.js";
import admissionsRoutes from "./admissions.routes.js";
import referralsRoutes from "./referrals.routes.js";
import medicationsRoutes from "./medications.routes.js";
import reportsRoutes from "./reports.routes.js";
import pm25Routes from "./pm25.routes.js";
import usersRoutes from "./users.routes.js";
import auditRoutes from "./audit.routes.js";
import sheetDataRoutes from "./sheet-data.routes.js";
import systemRoutes from "./system.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/students", studentsRoutes);
router.use("/visits", visitsRoutes);
router.use("/admissions", admissionsRoutes);
router.use("/referrals", referralsRoutes);
router.use("/medications", medicationsRoutes);
router.use("/reports", reportsRoutes);
router.use("/pm25", pm25Routes);
router.use("/users", usersRoutes);
router.use("/audit-logs", auditRoutes);
router.use("/sheet-data", sheetDataRoutes);
router.use("/system", systemRoutes);

export default router;
