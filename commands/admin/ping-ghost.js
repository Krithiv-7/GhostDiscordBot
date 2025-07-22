/**
 * Ghost API Ping Command
 * Tests connection to the Ghost Content API
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const ghostApi = require('../../ghostApi');
const logger = require('../../handlers/logger');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('ping-ghost')
        .setDescription('Tests the connection to the configured Ghost API'),
        
    async execute(interaction) {
        // Get guild configuration
        const guildId = interaction.guild.id;
        const config = db.getGuildConfig(guildId);
        
        // Check if guild is configured
        if (!config) {
            return interaction.reply({ 
                content: 'This server has not been configured yet. Please use `/setup` first.', 
                ephemeral: true 
            });
        }

        await interaction.deferReply({ ephemeral: true });
        
        try {
            // Start timer for latency calculation
            const start = Date.now();
            
            // Attempt to connect to Ghost API
            const apiResult = await ghostApi.testConnection(config.url, config.apiKey);
            
            // Calculate latency
            const apiLatency = Date.now() - start;
            const botLatency = Math.round(interaction.client.ws.ping);
            
            // Log ping metrics
            logger.debug(`Ghost API ping - Latency: ${apiLatency}ms, Success: ${apiResult ? 'Yes' : 'No'}`);
            
            // Create response embed
            const embed = new EmbedBuilder()
                .setColor(apiResult ? 0x00FF00 : 0xFF0000)
                .setTitle('Ghost API Connection Test')
                .addFields(
                    { name: 'Bot Latency', value: `${botLatency}ms`, inline: true },
                    { name: 'Ghost API Latency', value: apiResult ? `${apiLatency}ms` : 'Connection failed', inline: true },
                    { name: 'Status', value: apiResult ? '✅ Connected' : '❌ Failed', inline: true },
                    { name: 'Ghost URL', value: config.url }
                )
                .setFooter({ text: 'Use /setup to reconfigure if needed' })
                .setTimestamp();
                
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error(`Error pinging Ghost API`, error);
            await interaction.editReply({ 
                content: 'An error occurred while testing the Ghost API connection. Please verify your configuration.',
                ephemeral: true 
            });
        }
    },
};
