const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Removes all data for this server from the bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        db.deleteGuild(interaction.guildId);
        await interaction.reply({ content: 'All data for this server has been successfully removed.', ephemeral: true });
    },
};
