const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');
const ghost = require('../ghost.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Searches for posts on the configured Ghost site.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The search term to look for in post titles.')
                .setRequired(true)),
    async execute(interaction) {
        const guildConfig = db.getGuild(interaction.guildId);
        if (!guildConfig) {
            return interaction.reply({ content: 'This server has not been configured yet. Please use `/setup` first.', ephemeral: true });
        }

        const query = interaction.options.getString('query');
        await interaction.deferReply({ ephemeral: true });

        const posts = await ghost.searchPosts(guildConfig.apiUrl, guildConfig.apiKey, query);

        if (posts.length === 0) {
            return interaction.editReply({ content: 'No posts found matching your search term.' });
        }

        const searchEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Search Results for "${query}"`)
            .setDescription(posts.map(post => `[${post.title}](${post.url})`).join('\n'));

        await interaction.editReply({ embeds: [searchEmbed] });
    },
};
