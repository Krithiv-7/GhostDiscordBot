/**
 * Logger module for Ghost Discord Bot
 * Provides consistent logging across the application
 */
const fs = require('node:fs');
const path = require('node:path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Current date for log files
const date = new Date();
const logFileName = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.log`;
const logFilePath = path.join(logsDir, logFileName);

/**
 * Log levels:
 * 0 = DEBUG - Detailed debug information
 * 1 = INFO - Interesting events
 * 2 = WARN - Warning events that might cause issues
 * 3 = ERROR - Error events that might still allow the application to continue
 * 4 = FATAL - Critical errors that prevent features from working
 */
const LOG_LEVEL = process.env.NODE_ENV === 'production' ? 1 : 0;

/**
 * Format a log message with timestamp
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @returns {string} - Formatted log message
 */
function formatLogMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

/**
 * Write a log message to file
 * @param {string} message - Formatted log message
 */
function writeToFile(message) {
    fs.appendFileSync(logFilePath, message + '\n');
}

module.exports = {
    /**
     * Log a debug message
     * @param {string} message - Log message
     */
    debug(message) {
        if (LOG_LEVEL <= 0) {
            const formattedMessage = formatLogMessage('DEBUG', message);
            console.debug('\x1b[34m%s\x1b[0m', formattedMessage); // Blue
            writeToFile(formattedMessage);
        }
    },
    
    /**
     * Log an info message
     * @param {string} message - Log message
     */
    info(message) {
        if (LOG_LEVEL <= 1) {
            const formattedMessage = formatLogMessage('INFO', message);
            console.info('\x1b[32m%s\x1b[0m', formattedMessage); // Green
            writeToFile(formattedMessage);
        }
    },
    
    /**
     * Log a warning message
     * @param {string} message - Log message
     */
    warn(message) {
        if (LOG_LEVEL <= 2) {
            const formattedMessage = formatLogMessage('WARN', message);
            console.warn('\x1b[33m%s\x1b[0m', formattedMessage); // Yellow
            writeToFile(formattedMessage);
        }
    },
    
    /**
     * Log an error message
     * @param {string} message - Log message
     * @param {Error} error - Error object
     */
    error(message, error) {
        if (LOG_LEVEL <= 3) {
            const formattedMessage = formatLogMessage('ERROR', `${message}: ${error?.message || error}`);
            console.error('\x1b[31m%s\x1b[0m', formattedMessage); // Red
            
            if (error && error.stack) {
                console.error('\x1b[31m%s\x1b[0m', error.stack);
                writeToFile(formattedMessage + '\n' + error.stack);
            } else {
                writeToFile(formattedMessage);
            }
        }
    },
    
    /**
     * Log a fatal error message
     * @param {string} message - Log message
     * @param {Error} error - Error object
     */
    fatal(message, error) {
        if (LOG_LEVEL <= 4) {
            const formattedMessage = formatLogMessage('FATAL', `${message}: ${error?.message || error}`);
            console.error('\x1b[41m\x1b[37m%s\x1b[0m', formattedMessage); // White on red background
            
            if (error && error.stack) {
                console.error('\x1b[31m%s\x1b[0m', error.stack);
                writeToFile(formattedMessage + '\n' + error.stack);
            } else {
                writeToFile(formattedMessage);
            }
        }
    }
};
