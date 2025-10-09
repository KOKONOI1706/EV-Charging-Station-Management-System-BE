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