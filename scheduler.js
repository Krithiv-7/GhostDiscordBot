const db = require('./database.js');
const ghost = require('./ghost.js');
const { EmbedBuilder } = require('discord.js');

async function checkPosts(client, guildId = null) {
    console.log(`Checking for new posts... ${guildId ? `for guild ${guildId}` : 'for all guilds'}`);
    const guilds = guildId ? [db.getGuild(guildId)] : db.getAllGuilds();

    for (const guildConfig of guilds) {
        if (!guildConfig || !guildConfig.apiUrl || !guildConfig.apiKey) continue;

        const posts = await ghost.getLatestPosts(guildConfig.apiUrl, guildConfig.apiKey);
        if (posts.length === 0) continue;

        for (const post of posts.reverse()) {
            const publishedPost = db.getPublishedPost(post.id, guildConfig.id);

            if (!publishedPost) {
                // New post
                const channel = await client.channels.fetch(guildConfig.channelId);
                if (channel) {
                    const publishedDate = new Date(post.published_at);
                    const embed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle(post.title)
                        .setURL(post.url)
                        .setAuthor({ name: post.primary_author.name, iconURL: post.primary_author.profile_image, url: post.primary_author.url })
                        .setFooter({ text: `Published on ${publishedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` })
                        .setImage(post.feature_image)
                        .setDescription(post.excerpt);
                    
                    const messageContent = guildConfig.pingRole ? `<@&${guildConfig.pingRole}>` : '';
                    await channel.send({ content: messageContent, embeds: [embed] });
                    db.setPostAsPublished(post.id, guildConfig.id, new Date(post.published_at).getTime(), new Date(post.updated_at).getTime());
                }
            } else if (guildConfig.mode === 'default' && new Date(post.updated_at).getTime() > publishedPost.updatedAt) {
                // Updated post
                const channel = await client.channels.fetch(guildConfig.channelId);
                if (channel) {
                    const updatedDate = new Date(post.updated_at);
                    const embed = new EmbedBuilder()
                        .setColor('#FFFF00')
                        .setTitle(`Post Updated: ${post.title}`)
                        .setURL(post.url)
                        .setAuthor({ name: post.primary_author.name, iconURL: post.primary_author.profile_image, url: post.primary_author.url })
                        .setFooter({ text: `Updated on ${updatedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` })
                        .setImage(post.feature_image)
                        .setDescription(post.excerpt);
                    
                    const messageContent = guildConfig.pingRole ? `<@&${guildConfig.pingRole}>` : '';
                    await channel.send({ content: messageContent, embeds: [embed] });
                    db.setPostAsPublished(post.id, guildConfig.id, new Date(post.published_at).getTime(), new Date(post.updated_at).getTime());
                }
            }
        }
    }
}

function start(client) {
    checkPosts(client);
    setInterval(() => checkPosts(client), 5 * 60 * 1000); // Every 5 minutes
}

module.exports = { start, checkPosts };