import mysql from 'mysql2/promise';

async function testConnection() {
    try {
        console.log('🔐 Testing MySQL connection...');
        console.log('Host: localhost');
        console.log('Port: 3306');
        console.log('User: root');
        console.log('Password: root');
        console.log('Database: Aana_db\n');

        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'root'
        });

        console.log('✅ Connection successful!\n');

        // Show databases
        const [databases] = await connection.query('SHOW DATABASES');
        console.log('📊 Available databases:');
        databases.forEach(db => console.log(`   - ${db.Database}`));

        // Check if Aana_db exists
        const hasAanaDb = databases.some(d => d.Database === 'Aana_db');

        if (!hasAanaDb) {
            console.log('\n📝 Creating Aana_db database...');
            await connection.query('CREATE DATABASE Aana_db');
            console.log('✅ Aana_db created!');
        } else {
            console.log('\n✅ Aana_db database found!');
        }

        // Use Aana_db and create tasks table
        await connection.query('USE Aana_db');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                date DATETIME NULL,
                done TINYINT(1) DEFAULT 0,
                notified TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_done (done),
                INDEX idx_date (date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tasks table created/verified!');

        // Show tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('\n📋 Tables in Aana_db:');
        tables.forEach(table => console.log(`   - ${Object.values(table)[0]}`));

        await connection.end();

        console.log('\n🎉 Setup complete! MySQL is ready!');
        console.log('\n▶️  Now run: npm start');

    } catch (error) {
        console.error('\n❌ Connection failed:');
        console.error('Error:', error.message);
        console.error('\nPlease check:');
        console.error('1. MySQL service is running');
        console.error('2. Password is correct in .env file');
        console.error('3. User has proper permissions');
    }
}

testConnection();
