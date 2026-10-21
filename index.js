const express = require('express');
const mysql = require('mysql2');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'branchops_erp'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL Database successfully!');
});

app.get('/', (req, res) => {
    db.query("SELECT * FROM branches", (err, branches) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to load branches.');
        }

        db.query("SELECT * FROM inventory", (err, inventory) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Failed to load inventory.');
            }

            db.query("SELECT * FROM purchases", (err, purchases) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Failed to load purchases.');
                }

                db.query("SELECT * FROM employees", (err, employees) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Failed to load employees.');
                    }

                    // 1. Branch Cards
                    const branchCards = branches.map(b => `
                        <div class="branch-card">
                            <h3>🏪 ${b.name}</h3>
                            <p>📍 ${b.location}</p>
                            <p>📦 Stock:
                                <span class="stock-value">${b.stock}</span>
                            </p>
                        </div>
                    `).join('');

                    // 2. Inventory Rows
                    const inventoryRows = inventory.map(i => `
                        <tr>
                            <td class="item-name">${i.item_name}</td>
                            <td>${i.category}</td>
                            <td class="current-stock">
                                ${i.stock_qty} ${i.unit}
                            </td>
                            <td>
                                <span class="status-badge ${
                                    i.status === 'Good' ? 'status-good' : 'status-low'
                                }">${i.status}</span>
                            </td>
                        </tr>
                    `).join('');

                    // 3. Purchase Rows
                    const purchaseRows = purchases.map(p => `
                        <tr>
                            <td class="item-name">${p.po_number}</td>
                            <td>${p.supplier}</td>
                            <td class="current-stock">${p.total_amount}</td>
                            <td>
                                <span class="${
                                    p.status === 'Received'
                                        ? 'purchase-received'
                                        : 'purchase-pending'
                                }">${p.status}</span>
                            </td>
                        </tr>
                    `).join('');

                    // 4. Employee Rows
                    const employeeRows = employees.map(e => `
                        <tr>
                            <td class="item-name">👤 ${e.name}</td>
                            <td>${e.role}</td>
                            <td>${e.shift}</td>
                            <td>
                                <span class="${
                                    e.attendance === 'Present'
                                        ? 'attendance-present'
                                        : 'attendance-absent'
                                }">${e.attendance}</span>
                            </td>
                        </tr>
                    `).join('');

                    // Dashboard HTML
                    res.send(`
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport"
                                  content="width=device-width, initial-scale=1.0">

                            <title>BranchOps Console - Dashboard</title>

                            <style>
                                * {
                                    box-sizing: border-box;
                                    margin: 0;
                                    padding: 0;
                                }

                                body {
                                    font-family: 'Segoe UI', Tahoma, Geneva,
                                                 Verdana, sans-serif;
                                    background-color: #f8fafc;
                                    display: flex;
                                    min-height: 100vh;
                                    color: #1e293b;
                                }

                                /* Sidebar */
                                .sidebar {
                                    width: 260px;
                                    min-width: 260px;
                                    background-color: #ffffff;
                                    border-right: 1px solid #e2e8f0;
                                    display: flex;
                                    flex-direction: column;
                                    padding: 20px 0;
                                }

                                .logo-section {
                                    padding: 0 24px 30px;
                                    border-bottom: 1px solid #f1f5f9;
                                }

                                .logo-title {
                                    font-size: 18px;
                                    font-weight: bold;
                                    color: #0f172a;
                                    letter-spacing: 0.5px;
                                }

                                .menu-list {
                                    list-style: none;
                                    margin-top: 20px;
                                    display: flex;
                                    flex-direction: column;
                                    gap: 4px;
                                    padding: 0 12px;
                                }

                                .menu-item {
                                    display: flex;
                                    align-items: center;
                                    padding: 12px 16px;
                                    color: #475569;
                                    text-decoration: none;
                                    font-weight: 500;
                                    font-size: 14px;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    transition: 0.2s;
                                }

                                .menu-item:hover,
                                .menu-item.active {
                                    background-color: #f1f5f9;
                                    color: #0f172a;
                                }

                                .submenu-item {
                                    padding: 10px 16px 10px 36px;
                                    color: #64748b;
                                    font-size: 13px;
                                    text-decoration: none;
                                    display: block;
                                    border-radius: 6px;
                                }

                                .submenu-item:hover {
                                    background-color: #f8fafc;
                                    color: #0f172a;
                                }

                                /* Main Content */
                                .main-content {
                                    flex: 1;
                                    min-width: 0;
                                    display: flex;
                                    flex-direction: column;
                                }

                                .top-bar {
                                    background-color: #ffffff;
                                    border-bottom: 1px solid #e2e8f0;
                                    padding: 18px 30px;
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    gap: 15px;
                                }

                                .admin-badge {
                                    font-size: 13px;
                                    color: #64748b;
                                    background: #f1f5f9;
                                    padding: 6px 12px;
                                    border-radius: 20px;
                                    white-space: nowrap;
                                }

                                .content-body {
                                    padding: 30px;
                                    display: flex;
                                    flex-direction: column;
                                    gap: 30px;
                                }

                                .section-title {
                                    font-size: 16px;
                                    font-weight: 600;
                                    color: #1e293b;
                                    margin-bottom: 15px;
                                }

                                .card-grid {
                                    display: flex;
                                    gap: 20px;
                                    flex-wrap: wrap;
                                }

                                .branch-card {
                                    background: white;
                                    padding: 20px;
                                    border-radius: 8px;
                                    box-shadow: 0 2px 4px
                                                rgba(0,0,0,0.05);
                                    width: 230px;
                                    border: 1px solid #e2e8f0;
                                }

                                .branch-card h3 {
                                    margin-bottom: 12px;
                                    font-size: 16px;
                                    color: #1e293b;
                                }

                                .branch-card p {
                                    color: #64748b;
                                    font-size: 14px;
                                    margin-bottom: 8px;
                                }

                                .stock-value {
                                    font-weight: bold;
                                    color: #0f766e;
                                }

                                .table-container {
                                    background: white;
                                    border-radius: 8px;
                                    border: 1px solid #e2e8f0;
                                    padding: 20px;
                                    box-shadow: 0 1px 3px
                                                rgba(0,0,0,0.02);
                                    overflow-x: auto;
                                }

                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    text-align: left;
                                    font-size: 14px;
                                    min-width: 500px;
                                }

                                th {
                                    padding: 12px;
                                    color: #475569;
                                    background-color: #f8fafc;
                                    font-weight: 600;
                                    border-bottom: 2px solid #e2e8f0;
                                    white-space: nowrap;
                                }

                                td {
                                    padding: 12px;
                                    color: #64748b;
                                    border-bottom: 1px solid #f1f5f9;
                                }

                                tbody tr:hover {
                                    background-color: #f8fafc;
                                }

                                .item-name {
                                    color: #1e293b;
                                    font-weight: 600;
                                }

                                .current-stock {
                                    color: #1e293b;
                                    font-weight: bold;
                                }

                                .status-badge {
                                    display: inline-block;
                                    padding: 4px 8px;
                                    border-radius: 4px;
                                    font-weight: bold;
                                    font-size: 12px;
                                }

                                .status-good {
                                    background: #ccfbf1;
                                    color: #115e59;
                                }

                                .status-low {
                                    background: #fee2e2;
                                    color: #991b1b;
                                }

                                .purchase-received,
                                .attendance-present {
                                    color: #16a34a;
                                    font-weight: bold;
                                    font-size: 13px;
                                }

                                .purchase-pending,
                                .attendance-absent {
                                    color: #ea580c;
                                    font-weight: bold;
                                    font-size: 13px;
                                }

                                .footer {
                                    text-align: center;
                                    color: #94a3b8;
                                    font-size: 12px;
                                    padding: 20px;
                                }

                                @media (max-width: 900px) {
                                    body {
                                        flex-direction: column;
                                    }

                                    .sidebar {
                                        width: 100%;
                                        min-width: 0;
                                        padding: 15px 0;
                                    }

                                    .logo-section {
                                        padding-bottom: 15px;
                                    }

                                    .menu-list {
                                        flex-direction: row;
                                        flex-wrap: wrap;
                                    }

                                    .menu-list li {
                                        max-width: 100%;
                                    }

                                    .submenu-item {
                                        display: none;
                                    }

                                    .content-body {
                                        padding: 20px;
                                    }

                                    .top-bar {
                                        padding: 18px 20px;
                                    }
                                }

                                @media (max-width: 500px) {
                                    .top-bar {
                                        align-items: flex-start;
                                        flex-direction: column;
                                    }

                                    .content-body {
                                        padding: 12px;
                                        gap: 20px;
                                    }

                                    .branch-card {
                                        width: 100%;
                                    }

                                    .table-container {
                                        padding: 12px;
                                    }
                                }
                            </style>
                        </head>

                        <body>

                            <!-- Sidebar -->
                            <aside class="sidebar">
                                <div class="logo-section">
                                    <div class="logo-title">
                                        📊 BRANCHOPS
                                    </div>

                                    <span style="
                                        font-size:11px;
                                        color:#94a3b8;
                                        font-weight:600;">
                                        Coffee & Bakery ERP
                                    </span>
                                </div>

                                <ul class="menu-list">
                                    <li>
                                        <a href="/" class="menu-item active">
                                            🎛️ Dashboard
                                        </a>
                                    </li>

                                    <li>
                                        <a href="#inventory" class="menu-item">
                                            📦 Inventory
                                        </a>

                                        <div style="margin-top:4px;">
                                            <a href="#inventory"
                                               class="submenu-item">
                                                ▪️ Stock Levels
                                            </a>

                                            <a href="#inventory"
                                               class="submenu-item">
                                                ▪️ Reorder Requests
                                            </a>

                                            <a href="#inventory"
                                               class="submenu-item">
                                                ▪️ Inventory Counts
                                            </a>
                                        </div>
                                    </li>

                                    <li>
                                        <a href="#purchases" class="menu-item">
                                            🛒 Purchases
                                        </a>
                                    </li>

                                    <li>
                                        <a href="#maintenance" class="menu-item">
                                            🔧 Maintenance
                                        </a>
                                    </li>

                                    <li>
                                        <a href="#employees" class="menu-item">
                                            👥 Employees
                                        </a>
                                    </li>

                                    <li>
                                        <a href="#logistics" class="menu-item">
                                            🚚 Logistics
                                        </a>
                                    </li>
                                </ul>
                            </aside>

                            <!-- Main Content -->
                            <main class="main-content">

                                <div class="top-bar">
                                    <h2 style="
                                        font-size:18px;
                                        color:#0f172a;
                                        font-weight:600;">
                                        Central Console Overview
                                    </h2>

                                    <span class="admin-badge">
                                        👤 Admin Mode
                                    </span>
                                </div>

                                <div class="content-body">

                                    <!-- Branch Section -->
                                    <section>
                                        <div class="section-title">
                                            Live Branches
                                        </div>

                                        <div class="card-grid">
                                            ${branchCards}
                                        </div>
                                    </section>

                                    <!-- Inventory Table -->
                                    <section id="inventory"
                                             class="table-container">

                                        <div class="section-title">
                                            Stock Levels Summary
                                        </div>

                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Item Name</th>
                                                    <th>Category</th>
                                                    <th>Current Stock</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                ${inventoryRows}
                                            </tbody>
                                        </table>
                                    </section>

                                    <!-- Purchase Table -->
                                    <section id="purchases"
                                             class="table-container">

                                        <div class="section-title">
                                            Recent Reorder Requests
                                        </div>

                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>PO Number</th>
                                                    <th>Supplier</th>
                                                    <th>Total Amount</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                ${purchaseRows}
                                            </tbody>
                                        </table>
                                    </section>

                                    <!-- Employee Table -->
                                    <section id="employees"
                                             class="table-container">

                                        <div class="section-title">
                                            Employee Attendance
                                        </div>

                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Employee Name</th>
                                                    <th>Role</th>
                                                    <th>Shift</th>
                                                    <th>Attendance</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                ${employeeRows}
                                            </tbody>
                                        </table>
                                    </section>

                                    <!-- Maintenance Section -->
                                    <section id="maintenance"
                                             class="table-container">

                                        <div class="section-title">
                                            🔧 Maintenance
                                        </div>

                                        <p style="color:#64748b;font-size:14px;">
                                            Maintenance module is ready for
                                            future integration.
                                        </p>
                                    </section>

                                    <!-- Logistics Section -->
                                    <section id="logistics"
                                             class="table-container">

                                        <div class="section-title">
                                            🚚 Logistics
                                        </div>

                                        <p style="color:#64748b;font-size:14px;">
                                            Logistics module is ready for
                                            future integration.
                                        </p>
                                    </section>

                                </div>

                                <footer class="footer">
                                    BranchOps ERP &copy; 2026
                                    | Central Management Console
                                </footer>

                            </main>

                        </body>
                        </html>
                    `);
                });
            });
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});