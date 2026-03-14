const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false } // necesario en Supabase
});

// Imitamos un poco la interfaz de mysql2: db.query(...) devuelve [rows]
// y añadimos getClient() para manejar transacciones manuales
module.exports = {
  query: async (text, params) => {
    const res = await pool.query(text, params);
    return [res.rows, res];
  },
  getClient: async () => {
    return pool.connect();
  }
};
