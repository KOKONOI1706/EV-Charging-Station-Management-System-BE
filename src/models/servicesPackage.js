import { supabaseAdmin } from '../config/supabase.js';

export const createUserPackage = async ({ user_id, payment_id, package_id, duration_days }) => {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + duration_days);

  const { data, error } = await supabaseAdmin
    .from('user_packages')
    .insert([
      {
        user_id,
        payment_id,
        package_id,
        start_date: startDate,
        end_date: endDate,
        status: 'Active',
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};
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
