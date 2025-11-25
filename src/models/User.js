/**
 * ========================================
 * USER MODEL
 * ========================================
 * Model để thao tác với bảng users trong database
 * 
 * Chức năng:
 * - CRUD operations cho users:
 *   + getAll(): Lấy tất cả users (Admin only)
 *   + getById(id): Lấy user theo ID
 *   + getByEmail(email): Lấy user theo email (cho login)
 *   + create(userData): Tạo user mới
 *   + update(id, updates): Cập nhật thông tin user
 *   + delete(id): Xóa user
 *   + checkEmailExists(email): Kiểm tra email đã tồn tại
 * 
 * Bảo mật:
 * - Dùng supabaseAdmin client (bypass RLS policies)
 * - Không trả về password hash trong các method get
 * - Chỉ select các fields cần thiết
 * 
 * Trường dữ liệu:
 * - user_id: Primary key (auto-increment)
 * - name, email, phone: Thông tin cơ bản
 * - password_hash: Mật khẩu đã hash (không trả về client)
 * - role: Vai trò (liên kết với bảng roles)
 * - is_active: Trạng thái tài khoản
 * - email_verified: Đã xác thực email chưa
 * - created_at, updated_at: Timestamps
 */

// Import Supabase admin client (bypass RLS)
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Class UserModel - Model cho người dùng
 * Tất cả methods đều static vì không cần instance
 */
export class UserModel {
  static async getAll() {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  static async getByEmail(email) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }

  static async create(userData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([userData])
        .select('id, name, email, role, created_at, updated_at')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async update(id, updates) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, name, email, role, created_at, updated_at')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async checkEmailExists(email) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking email exists:', error);
      throw error;
    }
  }
}