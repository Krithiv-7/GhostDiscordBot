const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database.js');
const ghost = require('../ghost.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping-ghost')
        .setDescription('Pings the bot and the configured Ghost API.'),
    async execute(interaction) {
        const guildConfig = db.getGuild(interaction.guildId);
        if (!guildConfig) {
            return interaction.reply({ content: 'This server has not been configured yet. Please use `/setup` first.', ephemeral: true });
        }

        const botLatency = Date.now() - interaction.createdTimestamp;
        const ghostLatency = await ghost.pingGhost(guildConfig.apiUrl, guildConfig.apiKey);

        const pingEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Ping Results')
            .addFields(
                { name: 'Bot Latency', value: `${botLatency}ms` },
                { name: 'Ghost API Latency', value: ghostLatency >= 0 ? `${ghostLatency}ms` : 'Error: Could not ping Ghost API. Check your credentials.' }
            );

        await interaction.reply({ embeds: [pingEmbed], ephemeral: true });
    },
};
