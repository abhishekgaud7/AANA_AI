# MySQL Setup Guide for AANA AI To-Do App

## Prerequisites
- MySQL Server installed on your system
- Node.js and npm installed

## Quick Start

### Step 1: Start MySQL Server

**Windows:**
```bash
# If MySQL is installed as a service
net start MySQL80

# Or use MySQL Workbench to start the server
```

**Mac/Linux:**
```bash
# Using Homebrew
brew services start mysql

# Or using systemctl
sudo systemctl start mysql
```

### Step 2: Configure Database Credentials

1. Navigate to the `server` directory
2. Edit the `.env` file with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=todo_app_db
PORT=3001
```

> **Note:** If you don't have a MySQL password set, leave `DB_PASSWORD` empty.

### Step 3: Start the Backend Server

Open a **new terminal window** and run:

```bash
cd server
npm start
```

Expected output:
```
🚀 Starting server...
✅ Database connection successful
✅ Database initialized successfully
✅ Server running on http://localhost:3001
📊 API endpoint: http://localhost:3001/api/tasks
```

### Step 4: Verify Connection

1. The frontend should automatically detect the backend
2. Look for the green banner: **"✅ Connected to MySQL"**
3. All tasks will now be stored in MySQL database

## Troubleshooting

### Error: "Database connection failed"

**Possible causes:**
1. MySQL server is not running
2. Incorrect credentials in `.env` file
3. MySQL port is different (check your MySQL configuration)

**Solutions:**
```bash
# Check if MySQL is running (Windows)
sc query MySQL80

# Check if MySQL is running (Mac/Linux)
mysql.server status

# Test MySQL connection
mysql -u root -p
```

### Error: "Access denied for user"

Your password in `.env` file is incorrect. Update it:
```env
DB_PASSWORD=your_correct_password
```

### Error: "Cannot connect to MySQL server"

MySQL might be running on a different port. Check your MySQL configuration:
```bash
mysql -u root -p -e "SHOW VARIABLES LIKE 'port';"
```

Then update `.env`:
```env
DB_PORT=3307  # or whatever port MySQL is using
```

## Database Schema

The backend automatically creates this table:

```sql
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    date DATETIME NULL,
    done TINYINT(1) DEFAULT 0,
    notified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_done (done),
    INDEX idx_date (date)
);
```

## Viewing Your Data

### Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Navigate to `todo_app_db` database
4. Browse the `tasks` table

### Using Command Line
```bash
mysql -u root -p
```

```sql
USE todo_app_db;
SELECT * FROM tasks;
```

## Running Both Servers

You need **two terminal windows**:

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd server
npm start
```

## Offline Mode

If MySQL is not available, the app automatically falls back to **Dexie (IndexedDB)**:
- Orange banner: "💾 Using Local Storage (MySQL unavailable)"
- All features still work
- Data stored locally in browser
- When MySQL becomes available, reconnect by refreshing the page

## Production Deployment

For production, consider:
1. **Cloud MySQL:** PlanetScale, AWS RDS, or Google Cloud SQL
2. **Environment Variables:** Use secure environment variable management
3. **Connection Pooling:** Already configured in `db.js`
4. **HTTPS:** Enable SSL for MySQL connections

Example production `.env`:
```env
DB_HOST=your-cloud-mysql-host.com
DB_PORT=3306
DB_USER=production_user
DB_PASSWORD=secure_password
DB_NAME=todo_app_db
PORT=3001
```

## Need Help?

If you encounter issues:
1. Check MySQL server is running
2. Verify credentials in `.env`
3. Check terminal for error messages
4. Ensure port 3001 is not in use by another application
