/**
 * Tag Search Command
 * Searches for posts with a specific tag
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const ghostApi = require('../../ghostApi');
const logger = require('../../handlers/logger');

module.exports = {
    category: 'search',
    data: new SlashCommandBuilder()
        .setName('tag')
        .setDescription('Finds recent posts with a specific tag')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The tag to search for')
                .setRequired(true)
                .setAutocomplete(true)),
                
    async execute(interaction) {
        // Get guild configuration
        const guildId = interaction.guild.id;
        const config = db.getGuildConfig(guildId);
        
        if (!config) {
            return interaction.reply({ 
                content: 'This server has not been configured yet. Please use `/setup` first.', 
                ephemeral: true 
            });
        }

        // Get selected tag from options
        const tagSlug = interaction.options.getString('name');
        
        await interaction.deferReply();
        
        try {
            // Fetch posts with the selected tag
            const posts = await ghostApi.getPostsByTag(config.url, config.apiKey, tagSlug);
            const tagInfo = await ghostApi.getTagBySlug(config.url, config.apiKey, tagSlug);
            
            if (!posts || posts.length === 0) {
                return interaction.editReply(`No posts found with the tag "${tagInfo?.name || tagSlug}".`);
            }
            
            // Limit to 5 most recent posts
            const recentPosts = posts.slice(0, 5);
            
            // Create embed for tag results
            const embed = new EmbedBuilder()
                .setColor(tagInfo?.accent_color || 0x5865F2)
                .setTitle(`Posts tagged with "${tagInfo?.name || tagSlug}"`)
                .setDescription(tagInfo?.description || '')
                .setFooter({ text: `Found ${posts.length} posts • Ghost Blog: ${new URL(config.url).hostname}` });
                
            if (tagInfo?.feature_image) {
                embed.setThumbnail(tagInfo.feature_image);
            }
            
            // Add each post to the embed
            recentPosts.forEach((post, index) => {
                embed.addFields({
                    name: `${index + 1}. ${post.title}`,
                    value: `${post.published_at ? `Published: ${new Date(post.published_at).toLocaleDateString()}` : 'Draft'}\n[Read post](${post.url})`
                });
            });
            
            if (posts.length > 5) {
                embed.addFields({
                    name: 'More Posts',
                    value: `${posts.length - 5} additional posts found with this tag.`
                });
            }
            
            logger.debug(`Tag search for "${tagSlug}" by ${interaction.user.tag} returned ${posts.length} results`);
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error(`Error fetching posts by tag: ${error.message}`, error);
            await interaction.editReply('An error occurred while searching for posts. Please try again later.');
        }
    },
    
    // Handle autocomplete for tag names
    async autocomplete(interaction) {
        const guildConfig = db.getGuildConfig(interaction.guildId);
        if (!guildConfig) return;

        const focusedValue = interaction.options.getFocused().toLowerCase();
        try {
            const tags = await ghostApi.getAllTags(guildConfig.url, guildConfig.apiKey);
            const filtered = tags.filter(tag => 
                tag.name.toLowerCase().includes(focusedValue) || 
                tag.slug.includes(focusedValue)
            ).slice(0, 25);

            await interaction.respond(
                filtered.map(tag => ({ name: tag.name, value: tag.slug }))
            );
        } catch (error) {
            logger.error(`Error in tag autocomplete: ${error.message}`, error);
            await interaction.respond([]);
        }
    }
};
