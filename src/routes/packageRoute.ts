import { Router } from "express";
import { PackageController } from "../controllers/packageController";

const router = Router();

router.get("/", PackageController.getAll);
router.get("/:id", PackageController.getById);
router.post("/", PackageController.create);
router.put("/:id", PackageController.update);
router.delete("/:id", PackageController.delete);

export default router;
