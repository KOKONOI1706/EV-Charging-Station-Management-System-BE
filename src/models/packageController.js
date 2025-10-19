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
