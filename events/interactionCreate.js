const commandHandler = require('../handlers/commandHandler');
const logger = require('../handlers/logger');

module.exports = {
    name: 'interactionCreate',
    once: false,
    execute(interaction) {
        // Handle autocomplete interactions
        if (interaction.isAutocomplete()) {
            return commandHandler.handleAutocomplete(interaction);
        }
        
        // Handle command interactions
        if (interaction.isCommand()) {
            logger.debug(`Received command: ${interaction.commandName} from ${interaction.user.tag}`);
            return commandHandler.handleCommand(interaction);
        }
    }
};
