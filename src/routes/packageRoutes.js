import express from "express";
import { PackageController } from "../models/packageController.js";
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get("/", PackageController.getAll);
router.get("/:id", PackageController.getById);
router.post("/", authenticateToken, requireAdmin, PackageController.create);
router.put("/:id", authenticateToken, requireAdmin, PackageController.update);
router.delete("/:id", authenticateToken, requireAdmin, PackageController.delete);

export default router;
