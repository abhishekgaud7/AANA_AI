# MySQL Connection Troubleshooting

## Error: ER_ACCESS_DENIED_ERROR

Your MySQL root user has authentication enabled. Here are the solutions:

### Option 1: Find Your MySQL Password (Recommended)

If you set a password during MySQL installation, use it:

1. Edit `server/.env`:
   ```env
   DB_PASSWORD=your_mysql_password
   ```

2. Test the connection:
   ```bash
   cd server
   node test-connection.js
   ```

### Option 2: Reset MySQL Root Password

If you forgot your password, reset it:

1. **Stop MySQL Service:**
   ```powershell
   net stop MySQL84
   ```

2. **Start MySQL in Safe Mode** (skip grant tables):
   - Open MySQL installation directory (usually `C:\Program Files\MySQL\MySQL Server 8.4\bin`)
   - Run as Administrator:
   ```cmd
   mysqld --skip-grant-tables
   ```

3. **In a new terminal, connect without password:**
   ```cmd
   mysql -u root
   ```

4. **Reset the password:**
   ```sql
   FLUSH PRIVILEGES;
   ALTER USER 'root'@'localhost' IDENTIFIED BY '';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **Restart MySQL normally:**
   ```powershell
   net start MySQL84
   ```

### Option 3: Create New User for the App

Create a dedicated user with no password:

1. **Connect to MySQL:**
   ```cmd
   mysql -u root -p
   ```
   (Enter your root password)

2. **Create new user:**
   ```sql
   CREATE USER 'aana_user'@'localhost' IDENTIFIED BY '';
   GRANT ALL PRIVILEGES ON Aana_db.* TO 'aana_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Update `server/.env`:**
   ```env
   DB_USER=aana_user
   DB_PASSWORD=
   ```

### Option 4: Use MySQL Workbench

1. Open MySQL Workbench
2. Connect to your local MySQL instance
3. Go to Server → Users and Privileges
4. Select root user
5. Set or remove password
6. Apply changes

## Quick Test

After any solution, test the connection:

```bash
cd server
node test-connection.js
```

You should see:
```
✅ Connection successful!
✅ Database Aana_db created/verified
✅ Test complete!
```

Then start the backend:
```bash
npm start
```
