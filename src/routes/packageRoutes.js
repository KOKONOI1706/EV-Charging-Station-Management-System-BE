/**
 * ===============================================================
 * PACKAGE ROUTES (BACKEND)
 * ===============================================================
 * Express routes CRUD cho service packages
 * 
 * Endpoints:
 * - GET /api/packages - Lấy tất cả packages
 * - GET /api/packages/:id - Lấy package theo ID
 * - POST /api/packages - Tạo package mới
 * - PUT /api/packages/:id - Cập nhật package
 * - DELETE /api/packages/:id - Xóa package
 * 
 * Methods:
 * 1. GET /:
 *    - PackageController.getAll()
 *    - Return: Array of packages
 * 
 * 2. GET /:id:
 *    - PackageController.getById(id)
 *    - Return: Single package hoặc 404
 * 
 * 3. POST /:
 *    - Body: { name, description, price, duration_days, benefits, status }
 *    - PackageController.create(body)
 *    - Return: Created package (201)
 * 
 * 4. PUT /:id:
 *    - Body: Updated fields
 *    - PackageController.update(id, body)
 *    - Return: Updated package
 * 
 * 5. DELETE /:id:
 *    - PackageController.delete(id)
 *    - Return: Deleted package
 * 
 * Dependencies:
 * - PackageController: Business logic
 */

import express from "express";
import { PackageController } from "../models/packageController.js";

const router = express.Router();

router.get("/", PackageController.getAll);
router.get("/:id", PackageController.getById);
router.post("/", PackageController.create);
router.put("/:id", PackageController.update);
router.delete("/:id", PackageController.delete);

export default router;
