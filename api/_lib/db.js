const { Pool } = require("pg");
let pool;
function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  if (!pool) pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    max: 5, idleTimeoutMillis: 10000
  });
  return pool;
}
async function query(text, params=[]) { return getPool().query(text, params); }
module.exports = { getPool, query };
