import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
  dataDir: path.join(PROJECT_ROOT, 'data', 'worlds'),
  templateDir: path.join(PROJECT_ROOT, 'templates'),
  publicDir: path.join(PROJECT_ROOT, 'public'),
  migrationsDir: path.join(PROJECT_ROOT, 'src', 'db', 'migrations'),
  projectRoot: PROJECT_ROOT,
};
