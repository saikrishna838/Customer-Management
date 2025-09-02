#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(__dirname, '../backups');
const dbPath = path.join(__dirname, '../server/database.sqlite');
const backupPath = path.join(backupDir, `database-backup-${timestamp}.sqlite`);

// Create backups directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

console.log('Starting database backup...');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

// Simple backup by copying the file
fs.copyFile(dbPath, backupPath, (err) => {
    if (err) {
        console.error('Error backing up database:', err.message);
        process.exit(1);
    }
    
    console.log(`Database backed up successfully to: ${backupPath}`);
    
    // Get backup file size
    const stats = fs.statSync(backupPath);
    console.log(`Backup size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    db.close();
});

// Clean up old backups (keep only last 10)
fs.readdir(backupDir, (err, files) => {
    if (err) return;
    
    const backupFiles = files.filter(file => file.startsWith('database-backup-'))
        .sort()
        .reverse();
    
    if (backupFiles.length > 10) {
        const filesToDelete = backupFiles.slice(10);
        filesToDelete.forEach(file => {
            fs.unlink(path.join(backupDir, file), (err) => {
                if (err) console.error(`Error deleting old backup ${file}:`, err.message);
                else console.log(`Deleted old backup: ${file}`);
            });
        });
    }
});
