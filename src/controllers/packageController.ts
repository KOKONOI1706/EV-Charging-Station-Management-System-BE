import { Request, Response } from "express";
import { PackageService } from "../models/service";

export const PackageController = {
  async getAll(req: Request, res: Response) {
    try {
      const packages = await PackageService.getAll();
      res.json(packages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching packages" });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const pkg = await PackageService.getById(id);
      if (!pkg) return res.status(404).json({ message: "Package not found" });
      res.json(pkg);
    } catch (err) {
      res.status(500).json({ message: "Error fetching package" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const pkg = await PackageService.create(req.body);
      res.status(201).json(pkg);
    } catch (err) {
      res.status(500).json({ message: "Error creating package" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const pkg = await PackageService.update(id, req.body);
      res.json(pkg);
    } catch (err) {
      res.status(500).json({ message: "Error updating package" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const pkg = await PackageService.delete(id);
      res.json(pkg);
    } catch (err) {
      res.status(500).json({ message: "Error deleting package" });
    }
  },
};
