/**
 * ===============================================================
 * KV STORE ROUTES (BACKEND)
 * ===============================================================
 * Express routes cung cấp Key-Value storage API
 * 
 * Endpoints:
 * - GET /:key - Lấy value theo key
 * - POST /:key - Set value cho key
 * - DELETE /:key - Xóa key
 * - POST /mget - Lấy nhiều keys cùng lúc
 * - POST /mset - Set nhiều keys cùng lúc
 * - POST /mdel - Xóa nhiều keys cùng lúc
 * - GET / - Tìm keys theo prefix
 * 
 * Methods:
 * 
 * 1. GET /:key:
 *    - kv.get(key)
 *    - Return: { success, key, value }
 * 
 * 2. POST /:key:
 *    - Body: { value }
 *    - kv.set(key, value)
 *    - Return: { success, key }
 * 
 * 3. DELETE /:key:
 *    - kv.del(key)
 *    - Return: { success, key }
 * 
 * 4. POST /mget:
 *    - Body: { keys: [] }
 *    - kv.mget(keys)
 *    - Return: { success, values: [] }
 * 
 * 5. POST /mset:
 *    - Body: { keys: [], values: [] }
 *    - kv.mset(keys, values)
 *    - Return: { success }
 * 
 * 6. POST /mdel:
 *    - Body: { keys: [] }
 *    - kv.mdel(keys)
 *    - Return: { success }
 * 
 * 7. GET / (query: prefix):
 *    - Query param: ?prefix=user:
 *    - kv.getByPrefix(prefix)
 *    - Return: { success, values: [] }
 * 
 * Use cases:
 * - Cache: set('cache:home', data)
 * - Session: set('session:abc123', sessionData)
 * - Features: set('feature:newUI', true)
 * 
 * Error handling:
 * - Errors được pass tới next(err) middleware
 * 
 * Dependencies:
 * - kvStore service: Supabase-based storage
 */

import express from 'express';
import * as kv from '../supabase/kvStore.js';

const router = express.Router();

// Get a value by key
router.get('/:key', async (req, res, next) => {
  try {
    const value = await kv.get(req.params.key);
    res.json({ success: true, key: req.params.key, value });
  } catch (err) {
    next(err);
  }
});

// Set a value by key
router.post('/:key', async (req, res, next) => {
  try {
    const { value } = req.body;
    await kv.set(req.params.key, value);
    res.json({ success: true, key: req.params.key });
  } catch (err) {
    next(err);
  }
});

// Delete a key
router.delete('/:key', async (req, res, next) => {
  try {
    await kv.del(req.params.key);
    res.json({ success: true, key: req.params.key });
  } catch (err) {
    next(err);
  }
});

// Multi-get (body: { keys: [] })
router.post('/mget', async (req, res, next) => {
  try {
    const { keys } = req.body;
    const values = await kv.mget(keys || []);
    res.json({ success: true, values });
  } catch (err) {
    next(err);
  }
});

// Multi-set (body: { keys: [], values: [] })
router.post('/mset', async (req, res, next) => {
  try {
    const { keys, values } = req.body;
    await kv.mset(keys || [], values || []);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Multi-delete (body: { keys: [] })
router.post('/mdel', async (req, res, next) => {
  try {
    const { keys } = req.body;
    await kv.mdel(keys || []);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Get by prefix (query param: prefix)
router.get('/', async (req, res, next) => {
  try {
    const prefix = req.query.prefix || '';
    const values = await kv.getByPrefix(prefix);
    res.json({ success: true, values });
  } catch (err) {
    next(err);
  }
});

export default router;
