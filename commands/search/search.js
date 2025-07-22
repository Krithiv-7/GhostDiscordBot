/**
 * Search Command
 * Searches Ghost blog for posts matching search term
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ghostApi = require('../../ghostApi');
const db = require('../../database');
const logger = require('../../handlers/logger');

module.exports = {
    category: 'search',
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for posts on the Ghost blog')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('Search term')
                .setRequired(true)
                .setMinLength(3)
                .setMaxLength(100)),
    
    async execute(interaction) {
        // Get guild configuration
        const guildId = interaction.guild.id;
        const config = db.getGuildConfig(guildId);
        
        if (!config || !config.url || !config.apiKey) {
            return interaction.reply({
                content: 'This server has not been set up yet. An administrator must use the `/setup` command first.',
                ephemeral: true
            });
        }
        
        // Get search query
        const query = interaction.options.getString('query');
        
        await interaction.deferReply();
        
        try {
            // Search posts via Ghost API
            const posts = await ghostApi.searchPosts(config.url, config.apiKey, query);
            
            if (!posts || posts.length === 0) {
                return interaction.editReply(`No posts found matching "${query}".`);
            }
            
            // Limit to max 5 results
            const displayPosts = posts.slice(0, 5);
            
            // Create search results embed
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(`Search Results for "${query}"`)
                .setDescription(`Found ${posts.length} posts. Showing top ${displayPosts.length}:`)
                .setFooter({ text: `Ghost Blog: ${new URL(config.url).hostname}` });
            
            // Add each post to embed
            displayPosts.forEach((post, index) => {
                embed.addFields({
                    name: `${index + 1}. ${post.title}`,
                    value: `${post.excerpt ? post.excerpt.substring(0, 100) + '...' : 'No excerpt available'}\n[Read post](${post.url})`
                });
            });
            
            if (posts.length > 5) {
                embed.addFields({
                    name: 'More Results',
                    value: `${posts.length - 5} additional posts found. Refine your search for more specific results.`
                });
            }
            
            logger.debug(`Search query "${query}" by ${interaction.user.tag} returned ${posts.length} results`);
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error(`Error searching posts: ${error.message}`, error);
            await interaction.editReply('An error occurred while searching. Please try again later.');
        }
    }
};
