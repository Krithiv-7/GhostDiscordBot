const GhostContentAPI = require('@tryghost/content-api');

async function getLatestPosts(apiUrl, apiKey) {
    const api = new GhostContentAPI({
        url: apiUrl,
        key: apiKey,
        version: "v5.0"
    });

    try {
        const posts = await api.posts.browse({ limit: 5, order: 'published_at DESC', include: 'authors' });
        return posts;
    } catch (error) {
        console.error(`Error fetching posts from ${apiUrl}:`, error);
        return [];
    }
}

async function searchPosts(apiUrl, apiKey, query) {
    const api = new GhostContentAPI({
        url: apiUrl,
        key: apiKey,
        version: "v5.0"
    });

    try {
        const posts = await api.posts.browse({
            limit: 10,
            filter: `title:~'${query}'`
        });
        return posts;
    } catch (error) {
        console.error(`Error searching posts on ${apiUrl}:`, error);
        return [];
    }
}

async function getTags(apiUrl, apiKey) {
    const api = new GhostContentAPI({
        url: apiUrl,
        key: apiKey,
        version: "v5.0"
    });

    try {
        const tags = await api.tags.browse({ limit: 'all' });
        return tags;
    } catch (error) {
        console.error(`Error fetching tags from ${apiUrl}:`, error);
        return [];
    }
}

async function getPostsByTag(apiUrl, apiKey, tagSlug) {
    const api = new GhostContentAPI({
        url: apiUrl,
        key: apiKey,
        version: "v5.0"
    });

    try {
        const posts = await api.posts.browse({
            limit: 5,
            filter: `tag:${tagSlug}`
        });
        return posts;
    } catch (error) {
        console.error(`Error fetching posts by tag from ${apiUrl}:`, error);
        return [];
    }
}

async function pingGhost(apiUrl, apiKey) {
    const api = new GhostContentAPI({
        url: apiUrl,
        key: apiKey,
        version: "v5.0"
    });

    const startTime = Date.now();
    try {
        await api.settings.browse();
        const endTime = Date.now();
        return endTime - startTime;
    } catch (error) {
        return -1; // Indicate an error
    }
}

module.exports = { getLatestPosts, searchPosts, getTags, getPostsByTag, pingGhost };
