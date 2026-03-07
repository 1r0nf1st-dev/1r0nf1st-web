/**
 * Load .env and .env.local before any other server code.
 * Must be imported first so process.env is populated before config/supabase load.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot =
  path.basename(__dirname) === 'dist' ? path.resolve(__dirname, '..', '..') : path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env.local'), override: true });
