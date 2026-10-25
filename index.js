const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🌍 আপনার আসল অনলাইন Postgres ডাটাবেজ ইনফো
const db = new Pool({
  user: 'branchops_db_user',
  host: '://render.com',
  database: 'branchops_db',
  password: 'hsFrg4yqeDjc7evFpxX7HrzBvXqaCFzo7',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

// ডাটাবেজ কানেকশন চেক ও অটো টেবিল তৈরি (খুব গুরুত্বপূর্ণ)
db.connect(async (err, client, release) => {
  if (err) {
    return console.error('Database connection error:', err.stack);
  }

  console.log('Successfully connected to online database!');

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255)
      );
    `);

    console.log('Branches table verified successfully!');
  } catch (tableErr) {
    console.error('Error creating table:', tableErr.message);
  } finally {
    release();
  }
});

// 🏠 মেইন রুট (হোমপেজ টেস্ট)
app.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM branches');

    res.json({
      status: "Success",
      message: "Connected to Online Postgres DB successfully!",
      total_branches: result.rowCount,
      branches: result.rows
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      status: "Error",
      error: err.message
    });
  }
});

// 🚀 সার্ভার লিসেন
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
