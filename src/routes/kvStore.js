import express from 'express';
import * as kv from '../supabase/kvStore.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Only admins may access the KV store
router.use(authenticateToken);
router.use(requireAdmin);

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
