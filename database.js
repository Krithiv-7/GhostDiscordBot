const Database = require('better-sqlite3');
const db = new Database('ghost.db', { verbose: console.log });

function init() {
    // Create guilds table with ping role column
    const createGuildsTable = db.prepare(`
        CREATE TABLE IF NOT EXISTS guilds (
            id TEXT PRIMARY KEY,
            apiUrl TEXT,
            apiKey TEXT,
            channelId TEXT,
            mode TEXT DEFAULT 'default',
            pingRole TEXT DEFAULT NULL
        )
    `);
    createGuildsTable.run();

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
        console.log('Database indexes already exist or created successfully');
    }

    // Add pingRole column to existing guilds table if it doesn't exist
    try {
        db.prepare('ALTER TABLE guilds ADD COLUMN pingRole TEXT DEFAULT NULL').run();
    } catch (err) {
        // Column might already exist, ignore error
    }
}

function getGuild(id) {
    const stmt = db.prepare('SELECT * FROM guilds WHERE id = ?');
    return stmt.get(id);
}

function setGuild(id, apiUrl, apiKey, channelId, mode = 'default', pingRole = null) {
    const stmt = db.prepare('INSERT OR REPLACE INTO guilds (id, apiUrl, apiKey, channelId, mode, pingRole) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, apiUrl, apiKey, channelId, mode, pingRole);
}

function getAllGuilds() {
    const stmt = db.prepare('SELECT * FROM guilds');
    return stmt.all();
}

function getPublishedPost(postId, guildId) {
    const stmt = db.prepare('SELECT * FROM published_posts WHERE postId = ? AND guildId = ?');
    return stmt.get(postId, guildId);
}

function setPostAsPublished(postId, guildId, publishedAt, updatedAt) {
    const stmt = db.prepare('INSERT OR REPLACE INTO published_posts (postId, guildId, publishedAt, updatedAt) VALUES (?, ?, ?, ?)');
    stmt.run(postId, guildId, publishedAt, updatedAt);
}

function deleteGuild(id) {
    const deleteGuildStmt = db.prepare('DELETE FROM guilds WHERE id = ?');
    deleteGuildStmt.run(id);
    const deletePostsStmt = db.prepare('DELETE FROM published_posts WHERE guildId = ?');
    deletePostsStmt.run(id);
}

function updateGuildSetting(id, key, value) {
    const stmt = db.prepare(`UPDATE guilds SET ${key} = ? WHERE id = ?`);
    stmt.run(value, id);
}

module.exports = { init, getGuild, setGuild, getAllGuilds, getPublishedPost, setPostAsPublished, deleteGuild, updateGuildSetting };
