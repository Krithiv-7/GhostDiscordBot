/**
 * Ghost API Module for Ghost Discord Bot
 * Handles all interactions with the Ghost Content API
 */
const GhostContentAPI = require('@tryghost/content-api');
const logger = require('./handlers/logger');

/**
 * Creates a Ghost Content API client
 * @param {string} url - The Ghost blog URL
 * @param {string} key - The Ghost Content API key
 * @returns {Object} - Ghost Content API client
 */
function createClient(url, key) {
    return new GhostContentAPI({
        url: url,
        key: key,
        version: "v5.0"
    });
}

module.exports = {
    /**
     * Validates connection to a Ghost blog
     * @param {string} url - The Ghost blog URL
     * @param {string} key - The Ghost Content API key
     * @returns {Promise<boolean>} - Whether connection is valid
     */
    async validateConnection(url, key) {
        try {
            const api = createClient(url, key);
            // Try to get settings as a lightweight call to validate
            const settings = await api.settings.browse();
            return !!settings;
        } catch (error) {
            logger.error(`Failed to validate Ghost connection: ${error.message}`);
            return false;
        }
    },

    /**
     * Tests connection to a Ghost blog and returns timing
     * @param {string} url - The Ghost blog URL
     * @param {string} key - The Ghost Content API key
     * @returns {Promise<boolean>} - Whether connection is valid
     */
    async testConnection(url, key) {
        try {
            const api = createClient(url, key);
            // Try to get settings as a lightweight call to validate
            const settings = await api.settings.browse();
            return !!settings;
        } catch (error) {
            logger.error(`Failed to test Ghost connection: ${error.message}`);
            return false;
        }
    },

    /**
     * Gets recent posts from a Ghost blog
     * @param {string} url - The Ghost blog URL
     * @param {string} key - The Ghost Content API key
     * @param {number} limit - Maximum number of posts to retrieve
     * @returns {Promise<Array>} - Array of posts
     */
    async getRecentPosts(url, key, limit = 5) {
        try {
            const api = createClient(url, key);
            return await api.posts.browse({ 
                limit: limit,
                order: 'published_at DESC',
                include: 'authors,tags'
            });
        } catch (error) {
            logger.error(`Error fetching recent posts: ${error.message}`);
            return [];
        }
    },

    /**
     * Searches for posts in a Ghost blog
     * @param {string} url - The Ghost blog URL
     * @param {string} key - The Ghost Content API key
     * @param {string} query - The search query
     * @returns {Promise<Array>} - Array of matching posts
     */
    async searchPosts(url, key, query) {
        try {
            const api = createClient(url, key);
            // Sanitize the query for API
            const sanitizedQuery = query.replace(/'/g, "\\'");
            
            return await api.posts.browse({
                limit: 10,
                filter: `title:~'${sanitizedQuery}'`
            });
        } catch (error) {
            logger.error(`Error searching posts: ${error.message}`);
            return [];
        }
    },

    /**
     * Gets all tags from a Ghost blog
     * @param {string} url - The Ghost blog URL
     * @param {string} key - The Ghost Content API key
     * @returns {Promise<Array>} - Array of tags
     */
    async getAllTags(url, key) {
        try {
            const api = createClient(url, key);
            return await api.tags.browse({ limit: 'all' });
        } catch (error) {
            logger.error(`Error fetching tags: ${error.message}`);
            return [];
        }
    },

    /**
     * Gets information about a specific tag
     * @param {string} url - The Ghost blog URL
     * @param {string} key - The Ghost Content API key
     * @param {string} slug - The tag slug
     * @returns {Promise<Object>} - Tag information
     */
    async getTagBySlug(url, key, slug) {
        try {
            const api = createClient(url, key);
            return await api.tags.read({ slug: slug });
        } catch (error) {
            logger.error(`Error fetching tag by slug: ${error.message}`);
            return null;
        }
    },

    /**
     * Gets posts with a specific tag
     * @param {string} url - The Ghost blog URL
     * @param {string} key - The Ghost Content API key
     * @param {string} tagSlug - The tag slug
     * @returns {Promise<Array>} - Array of posts with the tag
     */
    async getPostsByTag(url, key, tagSlug) {
        try {
            const api = createClient(url, key);
            return await api.posts.browse({
                limit: 10,
                filter: `tag:${tagSlug}`,
                include: 'authors,tags'
            });
        } catch (error) {
            logger.error(`Error fetching posts by tag: ${error.message}`);
            return [];
        }
    }
};
