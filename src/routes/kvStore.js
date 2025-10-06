import express from 'express';
import * as kvStore from '../supabase/kvStore.js';

const router = express.Router();

// GET /api/kv/:key - Get value by key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await kvStore.get(key);
    
    if (value === undefined) {
      return res.status(404).json({
        success: false,
        error: 'Key not found'
      });
    }
    
    res.json({
      success: true,
      data: { key, value }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get value',
      message: error.message
    });
  }
});

// POST /api/kv - Set key-value pair
router.post('/', async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Key and value are required'
      });
    }
    
    await kvStore.set(key, value);
    
    res.json({
      success: true,
      message: 'Key-value pair stored successfully',
      data: { key, value }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to set value',
      message: error.message
    });
  }
});

// DELETE /api/kv/:key - Delete key-value pair
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    await kvStore.del(key);
    
    res.json({
      success: true,
      message: 'Key deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete key',
      message: error.message
    });
  }
});

// GET /api/kv/search/:prefix - Search by prefix
router.get('/search/:prefix', async (req, res) => {
  try {
    const { prefix } = req.params;
    const values = await kvStore.getByPrefix(prefix);
    
    res.json({
      success: true,
      data: values
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search by prefix',
      message: error.message
    });
  }
});

// POST /api/kv/bulk - Bulk operations
router.post('/bulk', async (req, res) => {
  try {
    const { operation, keys, values } = req.body;
    
    switch (operation) {
      case 'set':
        if (!keys || !values || keys.length !== values.length) {
          return res.status(400).json({
            success: false,
            error: 'Keys and values arrays must have same length'
          });
        }
        await kvStore.mset(keys, values);
        break;
        
      case 'get':
        if (!keys) {
          return res.status(400).json({
            success: false,
            error: 'Keys array is required'
          });
        }
        const results = await kvStore.mget(keys);
        return res.json({
          success: true,
          data: results
        });
        
      case 'delete':
        if (!keys) {
          return res.status(400).json({
            success: false,
            error: 'Keys array is required'
          });
        }
        await kvStore.mdel(keys);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid operation. Use: set, get, or delete'
        });
    }
    
    res.json({
      success: true,
      message: `Bulk ${operation} completed successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to perform bulk ${req.body.operation}`,
      message: error.message
    });
  }
});

export default router;