/**
 * ===============================================================
 * KEY-VALUE STORE SERVICE (DỊCH VỤ LƯU TRỮ KEY-VALUE)
 * ===============================================================
 * Service cung cấp key-value storage interface qua Supabase
 * 
 * Chức năng:
 * - 🔑 Set/Get/Delete key-value pairs
 * - 📦 Batch operations (mset, mget, mdel)
 * - 🔍 Search by prefix
 * - 💾 Persistent storage (Supabase table)
 * 
 * Table: kv_store_c4dbb6c1
 * - key: String (primary key)
 * - value: Any (JSON-serializable)
 * 
 * Methods:
 * 
 * 1. set(key, value)
 *    - Upsert key-value vào table
 *    - Nếu key đã tồn tại → update value
 *    - Nếu chưa tồn tại → insert
 * 
 * 2. get(key): value | undefined
 *    - SELECT value WHERE key = key
 *    - Return value hoặc undefined
 * 
 * 3. del(key)
 *    - DELETE WHERE key = key
 * 
 * 4. mset(keys[], values[])
 *    - Set nhiều key-value cùng lúc
 *    - Tạo array records [{key, value}, ...]
 *    - Upsert tất cả
 * 
 * 5. mget(keys[]): values[]
 *    - Get nhiều keys cùng lúc
 *    - SELECT WHERE key IN (keys)
 *    - Return array values (null nếu không tìm thấy)
 * 
 * 6. mdel(keys[])
 *    - Delete nhiều keys cùng lúc
 *    - DELETE WHERE key IN (keys)
 * 
 * 7. getByPrefix(prefix): values[]
 *    - Search keys bắt đầu bằng prefix
 *    - VD: prefix='session:' → Lấy 'session:123', 'session:456'
 *    - SELECT WHERE key LIKE 'prefix%'
 *    - Return array values
 * 
 * Use cases:
 * - Cache data: set('user:123', userData)
 * - Session storage: set('session:abc', sessionData)
 * - Feature flags: set('feature:newUI', true)
 * - Temporary data: set('temp:upload123', fileInfo)
 * 
 * Example:
 * ```javascript
 * // Set
 * await set('user:123', { name: 'John', email: 'john@example.com' });
 * 
 * // Get
 * const user = await get('user:123');
 * 
 * // Batch set
 * await mset(['key1', 'key2'], ['value1', 'value2']);
 * 
 * // Search
 * const allUsers = await getByPrefix('user:');
 * 
 * // Delete
 * await del('user:123');
 * ```
 * 
 * Error handling:
 * - All methods catch errors và log ra console
 * - Throw error để caller xử lý
 * 
 * Dependencies:
 * - Supabase client: Query kv_store_c4dbb6c1 table
 */

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