import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const getDatabaseEndpoint = () => {
  const raw = process.env.DATABASE_URL;
  if (!raw) return '(DATABASE_URL belum diset)';

  try {
    const url = new URL(raw);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.replace(/^\//, '') || 'postgres';
    return `${host}:${port}/${database}`;
  } catch {
    return raw.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
  }
};

// Buat koneksi pool
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let hasLoggedConnect = false;

// Event listener untuk log (sekali per proses, pool bisa buka banyak koneksi)
db.on('connect', () => {
  if (hasLoggedConnect) return;
  hasLoggedConnect = true;
  console.log(`✅ Database → ${getDatabaseEndpoint()}`);
});

db.on('error', (err) => {
  console.error(`❌ Database error (${getDatabaseEndpoint()}):`, err.message);
});

export default db;
