/**
 * ===============================================================
 * PACKAGE SERVICE (DỊCH VỤ QUẢN LÝ GÓI)
 * ===============================================================
 * Service CRUD cho service packages (gói dịch vụ)
 * 
 * Chức năng:
 * - 📋 Lấy danh sách gói (getAll)
 * - 🔍 Lấy chi tiết gói (getById)
 * - ➕ Tạo gói mới (create)
 * - ✏️ Cập nhật gói (update)
 * - 🗑️ Xóa gói (delete)
 * - 🔄 Parse JSON benefits field
 * 
 * Package structure:
 * - package_id: UUID
 * - name: Tên gói (VD: "Gói Cơ Bản", "Gói VIP")
 * - description: Mô tả chi tiết
 * - price: Giá (VND)
 * - duration_days: Số ngày hiệu lực (30, 90, 365)
 * - benefits: JSON array các lợi ích
 *   VD: ["Giảm 10% mọi lần sạc", "Miễn phí idle fee", "Hỗ trợ 24/7"]
 * - status: 'Active' hoặc 'Inactive'
 * - created_at, updated_at: Timestamps
 * 
 * Methods:
 * 
 * 1. getAll():
 *    - SELECT * FROM service_packages
 *    - ORDER BY created_at DESC
 *    - Parse benefits từ JSON string → Array
 *    - Return: Array of packages
 * 
 * 2. getById(id):
 *    - SELECT WHERE package_id = id
 *    - Parse benefits
 *    - Return: Single package hoặc null
 * 
 * 3. create(newData):
 *    - Input: { name, description, price, duration_days, benefits, status }
 *    - Parse benefits string → JSON (nếu cần)
 *    - INSERT vào service_packages
 *    - Return: Created package
 * 
 * 4. update(id, updatedData):
 *    - Parse benefits string → JSON
 *    - UPDATE WHERE package_id = id
 *    - Return: Updated package
 * 
 * 5. delete(id):
 *    - DELETE WHERE package_id = id
 *    - Return: Deleted package
 * 
 * Benefits parsing:
 * - Input có thể là string hoặc array
 * - Nếu string: JSON.parse(benefits)
 * - Nếu array: Dùng trực tiếp
 * - Lưu vào DB: JSON array
 * 
 * Example benefits:
 * ```json
 * [
 *   "Giảm giá 10% mọi lần sạc",
 *   "Miễn phí idle fee 15 phút đầu",
 *   "Tích điểm 2x",
 *   "Hỗ trợ 24/7"
 * ]
 * ```
 * 
 * Dependencies:
 * - Supabase: CRUD operations
 */

import { supabase } from "../config/supabase.js";

export const PackageService = {
  async getAll() {
    const { data, error } = await supabase
      .from("service_packages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return data.map(pkg => ({
      ...pkg,
      benefits:
        typeof pkg.benefits === "string"
          ? JSON.parse(pkg.benefits)
          : pkg.benefits,
    }));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("service_packages")
      .select("*")
      .eq("package_id", id)
      .single();
    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      benefits:
        typeof data.benefits === "string"
          ? JSON.parse(data.benefits)
          : data.benefits,
    };
  },

  async create(newData) {
    const { name, description, price, duration_days, benefits, status } = newData;
    const benefitsJson =
      typeof benefits === "string" ? JSON.parse(benefits) : benefits;

    const { data, error } = await supabase
      .from("service_packages")
      .insert([{ name, description, price, duration_days, benefits: benefitsJson, status }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, updatedData) {
    const { name, description, price, duration_days, benefits, status } = updatedData;
    const benefitsJson =
      typeof benefits === "string" ? JSON.parse(benefits) : benefits;

    const { data, error } = await supabase
      .from("service_packages")
      .update({
        name,
        description,
        price,
        duration_days,
        benefits: benefitsJson,
        status,
      })
      .eq("package_id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { data, error } = await supabase
      .from("service_packages")
      .delete()
      .eq("package_id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
