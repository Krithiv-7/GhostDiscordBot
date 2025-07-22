/**
 * Database module for Ghost Discord Bot
 * Handles all database operations
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('./handlers/logger');

// Ensure database directory exists
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'ghost.db'), { 
    verbose: process.env.NODE_ENV === 'development' ? console.log : null 
});

function init() {
    logger.info('Initializing database');
    
    // Create guilds table with expanded columns
    const createGuildsTable = db.prepare(`
        CREATE TABLE IF NOT EXISTS guilds (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            apiKey TEXT NOT NULL,
            announcementsEnabled INTEGER DEFAULT 0,
            channelId TEXT DEFAULT NULL,
            roleId TEXT DEFAULT NULL,
            mode TEXT DEFAULT 'new_and_updated',
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL
        )
    `);
    createGuildsTable.run();
    
    // Check if API keys need to be migrated to hashed format
    migrateApiKeys();

    // Create published_posts table
    const createPostsTable = db.prepare(`
        CREATE TABLE IF NOT EXISTS published_posts (
            postId TEXT,
            guildId TEXT,
            publishedAt INTEGER,
            updatedAt INTEGER,
            PRIMARY KEY (postId, guildId)
        )
    `);
    createPostsTable.run();

    // Create indexes for better performance
    try {
        db.prepare('CREATE INDEX IF NOT EXISTS idx_guilds_id ON guilds(id)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_published_posts_guild ON published_posts(guildId)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_published_posts_post ON published_posts(postId)').run();
        db.prepare('CREATE INDEX IF NOT EXISTS idx_published_posts_updated ON published_posts(updatedAt)').run();
    } catch (err) {
        // Indexes might already exist, ignore errors
        logger.debug('Database indexes already exist or created successfully');
    }

    // Migrate existing guilds table if needed
    try {
        // Check if old schema exists
        const tableInfo = db.prepare("PRAGMA table_info(guilds)").all();
        const columnNames = tableInfo.map(col => col.name);
        
        if (columnNames.includes('apiUrl') && !columnNames.includes('url')) {
            logger.info('Migrating database schema from old version');
            
            // Create temporary backup table
            db.prepare(`CREATE TABLE guilds_backup AS SELECT * FROM guilds`).run();
            
            // Drop and recreate with new schema
            db.prepare(`DROP TABLE guilds`).run();
            createGuildsTable.run();
            
            // Migrate data from backup to new schema
            const oldGuilds = db.prepare(`SELECT * FROM guilds_backup`).all();
            const insertStmt = db.prepare(`
                INSERT INTO guilds (
                    id, url, apiKey, announcementsEnabled, channelId, roleId, mode, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            for (const guild of oldGuilds) {
                insertStmt.run(
                    guild.id,
                    guild.apiUrl,
                    guild.apiKey,
                    guild.channelId ? 1 : 0,
                    guild.channelId,
                    guild.pingRole,
                    guild.mode === 'default' ? 'new_and_updated' : guild.mode,
                    Date.now(),
                    Date.now()
                );
            }
            
            // Drop backup table
            db.prepare(`DROP TABLE guilds_backup`).run();
            logger.info('Database migration complete');
        }
    } catch (err) {
        logger.error('Error during database migration', err);
    }
}

/**
 * Get guild configuration
 * @param {string} id - Guild ID
 * @returns {Object|null} - Guild configuration or null if not found
 */
function getGuildConfig(id) {
    const stmt = db.prepare('SELECT * FROM guilds WHERE id = ?');
    const result = stmt.get(id);
    
    if (!result) return null;
    
    // Convert SQLite INTEGER boolean to JS boolean
    if (result.announcementsEnabled !== undefined) {
        result.announcementsEnabled = !!result.announcementsEnabled;
    }
    
    return result;
}

/**
 * Set guild configuration
 * @param {string} id - Guild ID
 * @param {Object} config - Guild configuration object
 */
function setGuildConfig(id, config) {
    const now = Date.now();
    
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO guilds (
            id, url, apiKey, announcementsEnabled, channelId, roleId, mode, createdAt, updatedAt
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, 
            COALESCE((SELECT createdAt FROM guilds WHERE id = ?), ?),
            ?
        )
    `);
    
    // Hash the API key before storing it
    const hashedApiKey = config.apiKey ? hashApiKey(config.apiKey) : null;
    
    stmt.run(
        id,
        config.url,
        hashedApiKey,
        config.announcementsEnabled ? 1 : 0,
        config.channelId,
        config.roleId,
        config.mode || 'new_and_updated',
        id, now, // For the COALESCE to preserve original createdAt
        now
    );
}

/**
 * Get all guild configurations
 * @returns {Array} - Array of guild configurations
 */
function getAllGuildConfigs() {
    const stmt = db.prepare('SELECT * FROM guilds');
    const results = stmt.all();
    
    // Convert SQLite INTEGER boolean to JS boolean
    return results.map(result => {
        if (result.announcementsEnabled !== undefined) {
            result.announcementsEnabled = !!result.announcementsEnabled;
        }
        return result;
    });
}

/**
 * Get information about a published post
 * @param {string} postId - Post ID
 * @param {string} guildId - Guild ID
 * @returns {Object|null} - Published post information or null if not found
 */
function getPublishedPost(postId, guildId) {
    const stmt = db.prepare('SELECT * FROM published_posts WHERE postId = ? AND guildId = ?');
    return stmt.get(postId, guildId);
}

/**
 * Mark a post as published for a guild
 * @param {string} postId - Post ID
 * @param {string} guildId - Guild ID
 * @param {number} publishedAt - Published timestamp
 * @param {number} updatedAt - Updated timestamp
 */
function setPostAsPublished(postId, guildId, publishedAt, updatedAt) {
    const stmt = db.prepare('INSERT OR REPLACE INTO published_posts (postId, guildId, publishedAt, updatedAt) VALUES (?, ?, ?, ?)');
    stmt.run(postId, guildId, publishedAt, updatedAt);
}

/**
 * Remove all data for a guild
 * @param {string} id - Guild ID
 */
function removeGuild(id) {
    const deleteGuildStmt = db.prepare('DELETE FROM guilds WHERE id = ?');
    deleteGuildStmt.run(id);
    
    const deletePostsStmt = db.prepare('DELETE FROM published_posts WHERE guildId = ?');
    deletePostsStmt.run(id);
}

/**
 * Update a specific setting for a guild
 * @param {string} id - Guild ID
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 */
function updateGuildSetting(id, key, value) {
    if (key === 'announcementsEnabled') {
        value = value ? 1 : 0;
    }
    
    const stmt = db.prepare(`UPDATE guilds SET ${key} = ?, updatedAt = ? WHERE id = ?`);
    stmt.run(value, Date.now(), id);
}

/**
 * Hash an API key for secure storage
 * @param {string} apiKey - The API key to hash
 * @returns {string} - Hashed API key
 */
function hashApiKey(apiKey) {
    if (!apiKey) return null;
    return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Verify if an API key matches the stored hash
 * @param {string} storedHash - The stored hash from the database
 * @param {string} apiKey - The API key to verify
 * @returns {boolean} - Whether the API key is valid
 */
function verifyApiKey(storedHash, apiKey) {
    if (!storedHash || !apiKey) return false;
    const hashedInput = hashApiKey(apiKey);
    return storedHash === hashedInput;
}

/**
 * Migrate existing API keys to hashed format
 * This should be run once during database initialization
 */
function migrateApiKeys() {
    try {
        // Check if we need to migrate (if any key is not 64 chars - sha256 outputs 64 char hex)
        const needsMigration = db.prepare(`
            SELECT COUNT(*) as count FROM guilds 
            WHERE LENGTH(apiKey) < 64 OR apiKey LIKE 'ghost-api-key:%'
        `).get();
        
        if (needsMigration.count > 0) {
            logger.info(`Migrating ${needsMigration.count} API keys to secure hashed format`);
            
            // Get all guilds that need migration
            const guilds = db.prepare(`
                SELECT id, apiKey FROM guilds
                WHERE LENGTH(apiKey) < 64 OR apiKey LIKE 'ghost-api-key:%'
            `).all();
            
            // Start a transaction
            const updateStmt = db.prepare(`
                UPDATE guilds SET apiKey = ?, updatedAt = ? WHERE id = ?
            `);
            
            const transaction = db.transaction((guildsToUpdate) => {
                for (const guild of guildsToUpdate) {
                    const hashedKey = hashApiKey(guild.apiKey);
                    updateStmt.run(hashedKey, Date.now(), guild.id);
                }
            });
            
            transaction(guilds);
            logger.info('API key migration complete');
        }
    } catch (error) {
        logger.error('Error migrating API keys', error);
    }
}

// For backward compatibility
const getGuild = getGuildConfig;
const setGuild = (id, apiUrl, apiKey, channelId, mode = 'new_and_updated', pingRole = null) => {
    setGuildConfig(id, {
        url: apiUrl,
        apiKey: apiKey,
        announcementsEnabled: !!channelId,
        channelId: channelId,
        roleId: pingRole,
        mode: mode
    });
};
const getAllGuilds = getAllGuildConfigs;
const deleteGuild = removeGuild;

module.exports = { 
    init, 
    getGuildConfig, 
    setGuildConfig, 
    getAllGuildConfigs,
    getPublishedPost, 
    setPostAsPublished, 
    removeGuild, 
    updateGuildSetting,
    hashApiKey,
    verifyApiKey,
    // Legacy exports for backward compatibility
    getGuild,
    setGuild,
    getAllGuilds,
    deleteGuild
};
