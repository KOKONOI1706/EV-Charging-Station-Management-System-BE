import { pool } from "../config/db";

export const PackageService = {
  async getAll() {
    const result = await pool.query("SELECT * FROM service_packages ORDER BY created_at DESC");
    return result.rows;
  },

  async getById(id: number) {
    const result = await pool.query("SELECT * FROM service_packages WHERE package_id = $1", [id]);
    return result.rows[0];
  },

  async create(data: any) {
    const { name, description, price, duration_days, benefits, status } = data;
    const result = await pool.query(
      `INSERT INTO service_packages (name, description, price, duration_days, benefits, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, price, duration_days, benefits, status]
    );
    return result.rows[0];
  },

  async update(id: number, data: any) {
    const { name, description, price, duration_days, benefits, status } = data;
    const result = await pool.query(
      `UPDATE service_packages
       SET name=$1, description=$2, price=$3, duration_days=$4, benefits=$5, status=$6, updated_at=NOW()
       WHERE package_id=$7 RETURNING *`,
      [name, description, price, duration_days, benefits, status, id]
    );
    return result.rows[0];
  },

  async delete(id: number) {
    const result = await pool.query("DELETE FROM service_packages WHERE package_id = $1 RETURNING *", [id]);
    return result.rows[0];
  },
};
