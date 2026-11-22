const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Database migration completed.');
  await pool.end();
}

migrate().catch(async error => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
