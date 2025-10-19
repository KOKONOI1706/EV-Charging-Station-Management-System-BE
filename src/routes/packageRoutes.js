import express from "express";
import { PackageController } from "../models/packageController.js";

const router = express.Router();

router.get("/", PackageController.getAll);
router.get("/:id", PackageController.getById);
router.post("/", PackageController.create);
router.put("/:id", PackageController.update);
router.delete("/:id", PackageController.delete);

export default router;
