const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 10000; // Render-এর জন্য ডিফল্ট পোর্ট ১০০০০

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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
  console.log('Successfully connected to online database!');
  
  // যদি টেবিল না থাকে তবে অটোমেটিক তৈরি হবে
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255)
      );
    `);
    console.log('Branches table verified successfully!');
  } catch (tableErr) {
    console.error('Error creating table:', tableErr.message);
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
    res.status(500).json({ status: "Error", error: err.message });
  }
});

// 🚀 সার্ভার লিসেন
app.listen(PORT, () => {
  console.log('Server running on port ${PORT}'); //  এটি সঠিক i nedd same code
});