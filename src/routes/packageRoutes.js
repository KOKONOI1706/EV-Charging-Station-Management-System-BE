import express from "express";
import { PackageController } from "../models/packageController.js";
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public: list and get package details
router.get("/", PackageController.getAll);
router.get("/:id", PackageController.getById);

// Admin-only: create/update/delete packages
router.post("/", authenticateToken, requireAdmin, PackageController.create);
router.put("/:id", authenticateToken, requireAdmin, PackageController.update);
router.delete("/:id", authenticateToken, requireAdmin, PackageController.delete);

export default router;
