import { supabaseAdmin } from "../config/supabase.js";

export const PackageService = {
  async getAll() {
    const { data, error } = await supabaseAdmin
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
    const { data, error } = await supabaseAdmin
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

    const { data, error } = await supabaseAdmin
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

    const { data, error } = await supabaseAdmin
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
    const { data, error } = await supabaseAdmin
      .from("service_packages")
      .delete()
      .eq("package_id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
