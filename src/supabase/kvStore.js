import { supabase } from './client.js';

/**
 * Key-Value Store service using Supabase
 * Provides simple key-value storage interface
 */

// Set stores a key-value pair in the database
export const set = async (key, value) => {
  try {
    const { error } = await supabase
      .from('kv_store_c4dbb6c1')
      .upsert({
        key,
        value
      });
    
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('KV Store set error:', error);
    throw error;
  }
};

// Get retrieves a key-value pair from the database
export const get = async (key) => {
  try {
    const { data, error } = await supabase
      .from('kv_store_c4dbb6c1')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data?.value;
  } catch (error) {
    console.error('KV Store get error:', error);
    throw error;
  }
};

// Delete deletes a key-value pair from the database
export const del = async (key) => {
  try {
    const { error } = await supabase
      .from('kv_store_c4dbb6c1')
      .delete()
      .eq('key', key);
    
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('KV Store delete error:', error);
    throw error;
  }
};

// Sets multiple key-value pairs in the database
export const mset = async (keys, values) => {
  try {
    const records = keys.map((k, i) => ({ key: k, value: values[i] }));
    
    const { error } = await supabase
      .from('kv_store_c4dbb6c1')
      .upsert(records);
    
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('KV Store mset error:', error);
    throw error;
  }
};

// Gets multiple key-value pairs from the database
export const mget = async (keys) => {
  try {
    const { data, error } = await supabase
      .from('kv_store_c4dbb6c1')
      .select('value')
      .in('key', keys);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data?.map((d) => d.value) ?? [];
  } catch (error) {
    console.error('KV Store mget error:', error);
    throw error;
  }
};

// Deletes multiple key-value pairs from the database
export const mdel = async (keys) => {
  try {
    const { error } = await supabase
      .from('kv_store_c4dbb6c1')
      .delete()
      .in('key', keys);
    
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('KV Store mdel error:', error);
    throw error;
  }
};

// Search for key-value pairs by prefix
export const getByPrefix = async (prefix) => {
  try {
    const { data, error } = await supabase
      .from('kv_store_c4dbb6c1')
      .select('key, value')
      .like('key', `${prefix}%`);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data?.map((d) => d.value) ?? [];
  } catch (error) {
    console.error('KV Store getByPrefix error:', error);
    throw error;
  }
};