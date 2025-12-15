# Quick MySQL Workbench Setup Guide

## Step 1: Get Your Connection Details from MySQL Workbench

1. **Open MySQL Workbench**

2. **Look at your connection** (usually named "Local instance MySQL80" or similar)

3. **Click on the connection** to open it
   - If it asks for a password, note what password you enter
   - If it connects without asking, the password is empty

4. **Once connected, check if Aana_db exists:**
   - Look in the left sidebar under "SCHEMAS"
   - If you see `Aana_db`, great! ✅
   - If not, create it:
     ```sql
     CREATE DATABASE Aana_db;
     ```

## Step 2: Update Your .env File

Based on what you found in MySQL Workbench:

**If MySQL Workbench asked for a password:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=Aana_db
```

**If MySQL Workbench connected without a password:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=Aana_db
```

## Step 3: Test the Connection

```bash
cd server
node test-connection.js
```

## Step 4: Start the Backend

```bash
npm start
```

You should see:
```
✅ Database connection successful
✅ Database initialized successfully
✅ Server running on http://localhost:3001
```

---

## Alternative: Get Password from MySQL Workbench Settings

1. In MySQL Workbench, click **Database** → **Manage Connections**
2. Select your connection
3. Look at the **Password** field (it might be stored in vault)
4. Click **Test Connection** to verify it works
5. Use those exact settings in your `.env` file

---

## Still Not Working?

The app is **fully functional right now** with offline storage! MySQL just adds cloud persistence. You can:
- Use the app as-is with local storage ✅
- Fix MySQL later when you have time
- Everything works: particles, animations, confetti, reminders!
