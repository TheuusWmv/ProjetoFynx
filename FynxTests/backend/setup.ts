import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set environment variables before any application code is imported
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

// Clean test database before tests start
const dbPath = path.join(__dirname, '../../FynxApi/src/data/fynx_test.db');
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log('🧹 Test database deleted for a clean run.');
  } catch (err) {
    console.warn('Could not delete test database:', err);
  }
}
