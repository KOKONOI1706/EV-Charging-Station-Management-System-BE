/**
 * ===============================================================
 * START SCRIPT (SCRIPT KHỞI ĐỘNG SERVER)
 * ===============================================================
 * Entry point script đảm bảo working directory đúng trước khi start server
 * 
 * Vấn đề:
 * - ES modules trong Node.js không có __dirname
 * - Khi chạy từ thư mục khác, relative paths bị lỗi
 * - .env file không load được nếu chạy từ parent directory
 * 
 * Giải pháp:
 * - Lấy __dirname từ import.meta.url
 * - process.chdir(__dirname) → Set working directory
 * - Import server.js sau khi đã set đúng directory
 * 
 * Flow:
 * 1. Get __filename từ import.meta.url
 * 2. Get __dirname từ __filename
 * 3. Change working directory về __dirname
 * 4. Import và start server.js
 * 
 * Usage:
 * ```bash
 * # Thay vì chạy trực tiếp server.js
 * node src/server.js  # ❌ Có thể lỗi nếu chạy từ thư mục khác
 * 
 * # Chạy qua start.js
 * node start.js       # ✅ Luôn đúng working directory
 * ```
 * 
 * package.json:
 * ```json
 * {
 *   "scripts": {
 *     "start": "node start.js"
 *   }
 * }
 * ```
 * 
 * Dependencies:
 * - Node.js với ES modules support
 */

// Simple starter script to ensure correct working directory
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Change working directory to where this script is located
process.chdir(__dirname);

// Now import and start the actual server
import('./src/server.js').catch(console.error);