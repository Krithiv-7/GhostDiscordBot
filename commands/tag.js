const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');
const ghost = require('../ghost.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tag')
        .setDescription('Searches for the 5 most recent posts with a specific tag.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the tag to search for.')
                .setRequired(true)
                .setAutocomplete(true)),
    async autocomplete(interaction) {
        const guildConfig = db.getGuild(interaction.guildId);
        if (!guildConfig) return;

        const focusedValue = interaction.options.getFocused();
        const tags = await ghost.getTags(guildConfig.apiUrl, guildConfig.apiKey);
        const filtered = tags.filter(tag => tag.name.toLowerCase().startsWith(focusedValue.toLowerCase())).slice(0, 25);

        await interaction.respond(
            filtered.map(tag => ({ name: tag.name, value: tag.slug })),
        );
    },
    async execute(interaction) {
        const guildConfig = db.getGuild(interaction.guildId);
        if (!guildConfig) {
            return interaction.reply({ content: 'This server has not been configured yet. Please use `/setup` first.', ephemeral: true });
        }

        const tagSlug = interaction.options.getString('name');
        await interaction.deferReply({ ephemeral: true });

        const posts = await ghost.getPostsByTag(guildConfig.apiUrl, guildConfig.apiKey, tagSlug);

        if (posts.length === 0) {
            return interaction.editReply({ content: 'No posts found with that tag.' });
        }

        const tagEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Latest posts tagged with "${tagSlug}"`)
            .setDescription(posts.map(post => `[${post.title}](${post.url})`).join('\n'));

        await interaction.editReply({ embeds: [tagEmbed] });
    },
};
