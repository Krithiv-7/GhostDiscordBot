# Ghost Discord Bot - Privacy Policy

*Last Updated: July 21, 2025*

This Privacy Policy explains how Ghost Discord Bot ("we", "our", "us", "the Bot") collects, uses, and safeguards your information when you use our Discord bot.

## 1. Information We Collect

### 1.1. Server Data
- Discord Server ID
- Designated channel ID for posting articles
- Configuration preferences (posting mode, role ping settings)

### 1.2. Ghost API Data
- Ghost site URL (provided by you)
- Ghost Content API key (provided by you)
- Post IDs, publication dates, and update timestamps (for caching purposes)

### 1.3. Usage Data
- Command usage statistics (anonymized)
- Error logs for debugging purposes

## 2. How We Use Information

We use the collected information for the following purposes:
- To provide and maintain the Bot's functionality
- To create server-specific configurations
- To prevent duplicate posts
- To notify servers of new and updated Ghost blog content
- To improve the Bot based on usage patterns
- To fix bugs and troubleshoot issues

## 3. Data Storage

### 3.1. Storage Method
- All data is stored in a SQLite database file (`ghost.db`)
- The database is stored on secure servers with appropriate access controls

### 3.2. Data Retention
- Server configuration data is stored until you use the `/remove` command
- Post caching data is retained indefinitely to prevent duplicate notifications
- You can delete all your data at any time using the `/remove` command

## 4. Data Sharing

We do not sell, trade, or otherwise transfer your information to outside parties. Your data is:
- Not shared with third parties
- Not used for advertising
- Not used for marketing purposes

## 5. API Keys Security

### 5.1. Protection Measures
- API keys are stored securely in our database
- Access to the database is restricted and protected
- The Bot only uses API keys for their intended purpose (accessing Ghost content)

### 5.2. Recommendations
- We recommend using a Ghost Content API key with read-only permissions
- Never share your API keys with others
- If you suspect your keys are compromised, revoke them immediately in your Ghost admin panel

## 6. User Rights

You have the right to:
- Remove the Bot from your server at any time
- Delete all your stored data using the `/remove` command
- Request information about what data is stored about your server
- Modify your configuration at any time using the `/edit-setup` command

## 7. Children's Privacy

The Bot is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will promptly delete that information.

## 8. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify users of any significant changes by updating the "Last Updated" date at the top of this policy and, where appropriate, by adding a notice in the Bot's help command.

## 9. Data Security

We implement appropriate technical and organizational measures to protect your data against unauthorized or unlawful processing and against accidental loss, destruction, or damage. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.

## 10. Open Source Code

Ghost Discord Bot is an open source project. The complete source code is available for inspection and verification on GitHub at [https://github.com/Krithiv-7/GhostDiscordBot](https://github.com/Krithiv-7/GhostDiscordBot). This means you can:
- Verify exactly how your data is handled
- Inspect the security measures implemented
- Contribute improvements to the bot
- Report security vulnerabilities directly

We believe in transparency and user trust through open source development.

## 11. International Data Transfers

Your information may be transferred to and processed on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using the Bot, you consent to this transfer.

## 12. Contact Us

If you have any questions about this Privacy Policy or our data practices, please contact us at [contact@krithiv.dev].

---

By using Ghost Discord Bot, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
