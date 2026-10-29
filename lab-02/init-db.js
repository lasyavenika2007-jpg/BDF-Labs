const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'books.db');
const sqlPath = path.join(__dirname, 'setup.sql');

// Remove existing books.db if re-initializing
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to create database:', err.message);
    process.exit(1);
  }
  console.log('Connected to books.db');
});

const sql = fs.readFileSync(sqlPath, 'utf8');

db.exec(sql, (err) => {
  if (err) {
    console.error('Error executing setup SQL:', err.message);
    db.close();
    process.exit(1);
  }
  console.log('Table created and sample records inserted successfully.');

  db.all('SELECT * FROM book', [], (err, rows) => {
    if (err) {
      console.error('Error querying table:', err.message);
    } else {
      console.log(`Verified ${rows.length} records in book table:`);
      console.table(rows);
    }
    db.close();
  });
});
