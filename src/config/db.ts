import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT),
});

// ✅ Test connection
(async () => {
  try {
    await pool.connect();
    console.log("✅ Connected to PostgreSQL successfully");
  } catch (err) {
    console.error("❌ PostgreSQL connection error:", err);
  }
})();
