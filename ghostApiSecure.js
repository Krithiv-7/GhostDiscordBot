/**
 * Secure Ghost API Module for Ghost Discord Bot
 * Handles interactions with the Ghost Content API using securely stored API keys
 */
const ghostApi = require('./ghostApi');
const db = require('./database');
const logger = require('./handlers/logger');

// Store API keys in memory temporarily during runtime
// This avoids repeatedly asking users for API keys during the bot's operation
const apiKeyCache = new Map();

/**
 * Get or request the API key for a guild
 * @param {string} guildId - The guild ID
 * @param {Function} requestKeyCallback - Optional callback to request API key from user
 * @returns {string|null} - The API key or null if not available
 */
async function getApiKey(guildId, requestKeyCallback = null) {
    // Check if we have it cached in memory
    if (apiKeyCache.has(guildId)) {
        return apiKeyCache.get(guildId);
    }
    
    // If we have a request callback, use it to get the key from the user
    if (requestKeyCallback) {
        const key = await requestKeyCallback();
        if (key) {
            // Verify against stored hash
            const guildConfig = db.getGuildConfig(guildId);
            if (guildConfig && db.verifyApiKey(guildConfig.apiKey, key)) {
                // Cache the API key for future use during this session
                apiKeyCache.set(guildId, key);
                return key;
            }
        }
    }
    
    return null;
}

/**
 * Set or update an API key for a guild
 * @param {string} guildId - The guild ID
 * @param {string} apiKey - The API key
 */
function setApiKey(guildId, apiKey) {
    // Cache the API key for future use during this session
    apiKeyCache.set(guildId, apiKey);
    
    // Update the database with the hashed key
    const guildConfig = db.getGuildConfig(guildId);
    if (guildConfig) {
        guildConfig.apiKey = apiKey;
        db.setGuildConfig(guildId, guildConfig);
    }
}

/**
 * Clear API key from cache (e.g., when bot restarts or key is changed)
 * @param {string} guildId - The guild ID
 */
function clearApiKey(guildId) {
    apiKeyCache.delete(guildId);
}

/**
 * Get recent posts from Ghost blog using secure API key handling
 * @param {string} guildId - The guild ID
 * @param {Function} requestKeyCallback - Optional callback to request API key
 * @returns {Promise<Array>} - Array of posts
 */
async function getRecentPostsSecure(guildId, requestKeyCallback = null) {
    const guildConfig = db.getGuildConfig(guildId);
    if (!guildConfig || !guildConfig.url) {
        logger.error(`No configuration found for guild ${guildId}`);
        return [];
    }
    
    const apiKey = await getApiKey(guildId, requestKeyCallback);
    if (!apiKey) {
        logger.error(`No API key available for guild ${guildId}`);
        return [];
    }
    
    return await ghostApi.getRecentPosts(guildConfig.url, apiKey);
}

/**
 * Test connection to Ghost blog using secure API key handling
 * @param {string} guildId - The guild ID 
 * @param {string} apiKey - The API key to test
 * @returns {Promise<Object>} - Test result
 */
async function testConnectionSecure(guildId, apiKey) {
    const guildConfig = db.getGuildConfig(guildId);
    if (!guildConfig || !guildConfig.url) {
        return { success: false, message: 'No configuration found' };
    }
    
    const result = await ghostApi.testConnection(guildConfig.url, apiKey);
    
    if (result.success) {
        // If the test was successful, cache the API key
        setApiKey(guildId, apiKey);
    }
    
    return result;
}

module.exports = {
    getApiKey,
    setApiKey,
    clearApiKey,
    getRecentPostsSecure,
    testConnectionSecure
};
