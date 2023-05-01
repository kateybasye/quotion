const sqlite3 = require('sqlite3').verbose();

// Open the database connection
const db = new sqlite3.Database('updates.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the updates database.');
});

// Create the Updates table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS Updates (
    id INTEGER PRIMARY KEY,
    date DATE
  )
`, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Updates table created or already exists.');

  // Insert a new row with the current date and time
  const now = new Date().toISOString();
  db.run(`INSERT INTO Updates (date) VALUES (?)`, [now], (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`Inserted a new row with date: ${now}`);
    }
  });
  
});

module.exports = db;
