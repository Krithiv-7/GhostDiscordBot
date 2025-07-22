/**
 * Ping Command
 * Checks bot latency and connectivity
 */
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../handlers/logger');

module.exports = {
    category: 'general',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Shows the bot\'s latency and API response time'),
        
    async execute(interaction) {
        // Start timer to measure latency
        const start = Date.now();
        
        // Send initial reply
        await interaction.deferReply();
        
        // Calculate latency
        const latency = Date.now() - start;
        const apiLatency = Math.round(interaction.client.ws.ping);
        
        // Log ping metrics
        logger.debug(`Ping command used - Latency: ${latency}ms, API: ${apiLatency}ms`);
        
        // Send response
        await interaction.editReply(`🏓 **Pong!**\n📊 **Bot Latency:** ${latency}ms\n📡 **API Latency:** ${apiLatency}ms`);
    },
};
