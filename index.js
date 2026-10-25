const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🌍 আপনার আসল এবং সম্পূর্ণ অনলাইন Postgres ডাটাবেজ কানেকশন লিংক
const db = new Pool({
  connectionString: "postgres://branchops_db_user:hsFrg4yqeDjc7evFpxX7HrzBvXqaCFzo7@://render.com",
  ssl: {
    rejectUnauthorized: false
  }
});

// ডাটাবেজ কানেকশন চেক ও অটো টেবিল তৈরি
db.connect(async (err) => {
  if (err) {
    return console.error('Database connection error:', err.stack);
  }
  console.log('Successfully connected to online database!');
  
  // যদি branches টেবিল না থাকে তবে অটোমেটিক অনলাইনে তৈরি হবে
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
  console.log('Server running on port ${PORT}');
});
// 📦 ইনভেন্টরি বা স্টক লেভেলের জন্য নতুন টেবিল তৈরি (সার্ভার রান হলে অটোমেটিক তৈরি হবে)
db.query(`
  CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    current_stock NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL, -- যেমন: kg, liters, pcs
    reorder_level NUMERIC(10,2) NOT NULL DEFAULT 10.00
  );
`).then(() => {
  console.log('Inventory table verified/created successfully!');
}).catch(err => console.error('Error creating inventory table:', err.message));

// 📥 ১. ডাটাবেজ থেকে সমস্ত স্টক লেভেলের তথ্য দেখার API (GET Route)
app.get('/api/inventory', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM inventory ORDER BY id ASC');
    res.json({
      status: "Success",
      total_items: result.rowCount,
      data: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "Error", error: err.message });
  }
});

// ➕ ২. নতুন কোনো মালামাল বা স্টক আইটেম যোগ করার API (POST Route)
app.post('/api/inventory/add', async (req, res) => {
  const { item_name, current_stock, unit, reorder_level } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO inventory (item_name, current_stock, unit, reorder_level) VALUES ($1, $2, $3, $4) RETURNING *',
      [item_name, current_stock, unit, reorder_level]
    );
    res.json({
      status: "Success",
      message: "New stock item added successfully!",
      item: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "Error", error: err.message });
  }
});
