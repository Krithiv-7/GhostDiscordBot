const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');
const { checkPosts } = require('../scheduler.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Set up the Ghost integration for this server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('api_url')
                .setDescription('The API URL of your Ghost site')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('api_key')
                .setDescription('The Content API Key of your Ghost site')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to post updates in')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Whether to check for new posts only or new and updated posts.')
                .setRequired(false)
                .addChoices(
                    { name: 'New & Updated Posts (Default)', value: 'default' },
                    { name: 'New Posts Only', value: 'new_only' },
                ))
        .addRoleOption(option =>
            option.setName('ping_role')
                .setDescription('Optional role to ping when new posts are published')
                .setRequired(false)),
    async execute(interaction) {
        const existingConfig = db.getGuild(interaction.guildId);
        if (existingConfig) {
            return interaction.reply({ content: 'This server is already set up. Use `/edit-setup` to change settings or `/remove` to delete the configuration.', ephemeral: true });
        }

        const apiUrl = interaction.options.getString('api_url');
        const apiKey = interaction.options.getString('api_key');
        const channel = interaction.options.getChannel('channel');
        const mode = interaction.options.getString('mode') ?? 'default';
        const pingRole = interaction.options.getRole('ping_role');

        db.setGuild(interaction.guildId, apiUrl, apiKey, channel.id, mode, pingRole ? pingRole.id : null);

        const pingText = pingRole ? ` Role @${pingRole.name} will be pinged for new posts.` : '';
        await interaction.reply({ content: `Successfully set up the Ghost integration. Posts will be sent to #${channel.name}. Mode: ${mode === 'default' ? 'New & Updated' : 'New Only'}.${pingText} Fetching latest post...`, ephemeral: true });
        checkPosts(interaction.client, interaction.guildId);
    },
};
