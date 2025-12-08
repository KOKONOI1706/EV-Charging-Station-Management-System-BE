/**
 * ===============================================================
 * PACKAGE CONTROLLER (BACKEND)
 * ===============================================================
 * Controller xử lý requests cho service packages
 * 
 * Methods:
 * 
 * 1. getAll(req, res):
 *    - PackageService.getAll()
 *    - Return: Array packages (JSON)
 *    - 500 nếu lỗi
 * 
 * 2. getById(req, res):
 *    - PackageService.getById(id)
 *    - Return: Single package (JSON)
 *    - 404 nếu không tìm thấy
 *    - 500 nếu lỗi
 * 
 * 3. create(req, res):
 *    - Body: Package data
 *    - PackageService.create(body)
 *    - Return: Created package (201)
 *    - 400 nếu validation lỗi
 * 
 * 4. update(req, res):
 *    - Body: Updated fields
 *    - PackageService.update(id, body)
 *    - Return: Updated package (JSON)
 *    - 400 nếu validation lỗi
 * 
 * 5. delete(req, res):
 *    - PackageService.delete(id)
 *    - Return: Deleted package (JSON)
 *    - 500 nếu lỗi
 * 
 * Error handling:
 * - Catch errors từ service layer
 * - Return appropriate status codes
 * - Send error message trong response
 * 
 * Dependencies:
 * - PackageService: Business logic + DB operations
 */

import { PackageService } from "../services/packageService.js";

export const PackageController = {
  async getAll(req, res) {
    try {
      const data = await PackageService.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const id = req.params.id;
      const data = await PackageService.getById(id);
      if (!data) return res.status(404).json({ message: "Package not found" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const data = await PackageService.create(req.body);
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const id = req.params.id;
      const data = await PackageService.update(id, req.body);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const id = req.params.id;
      const data = await PackageService.delete(id);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
