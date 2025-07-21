const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edit-setup')
        .setDescription('Edits the server\'s Ghost integration settings.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('url')
                .setDescription('Updates the Ghost site API URL.')
                .addStringOption(option => option.setName('value').setDescription('The new API URL.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('key')
                .setDescription('Updates the Ghost Content API Key.')
                .addStringOption(option => option.setName('value').setDescription('The new API Key.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('Updates the channel for posting updates.')
                .addChannelOption(option => option.setName('value').setDescription('The new channel.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('mode')
                .setDescription('Updates the posting mode.')
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription('The new mode.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'New & Updated Posts (Default)', value: 'default' },
                            { name: 'New Posts Only', value: 'new_only' },
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ping-role')
                .setDescription('Updates the role to ping for new posts.')
                .addRoleOption(option => option.setName('value').setDescription('The role to ping (leave empty to remove).').setRequired(false))),
    async execute(interaction) {
        const guildConfig = db.getGuild(interaction.guildId);
        if (!guildConfig) {
            return interaction.reply({ content: 'This server has not been configured yet. Please use `/setup` first.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const value = interaction.options.get('value')?.value || interaction.options.get('value')?.role?.id || null;
        
        let dbKey;
        let displayValue;
        switch (subcommand) {
            case 'url':
                dbKey = 'apiUrl';
                displayValue = value;
                break;
            case 'key':
                dbKey = 'apiKey';
                displayValue = '***';  // Hide API key
                break;
            case 'channel':
                dbKey = 'channelId';
                displayValue = `<#${value}>`;
                break;
            case 'mode':
                dbKey = 'mode';
                displayValue = value;
                break;
            case 'ping-role':
                dbKey = 'pingRole';
                displayValue = value ? `<@&${value}>` : 'None (removed)';
                break;
        }

        db.updateGuildSetting(interaction.guildId, dbKey, value);
        await interaction.reply({ content: `Successfully updated the \`${subcommand}\` to ${displayValue}.`, ephemeral: true });
    },
};
