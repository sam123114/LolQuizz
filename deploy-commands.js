/**
 * This is a script used to deploy commands to your discord server
 */
const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

exports.deployCommands = function (clientId, guildId) {
    rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => console.log(`Successfully registered application commands for guild ID (${guildId})`))
        .catch((err) => console.log(`Failed to deploy application commands on guild ID (${guildId}). Error: ${err.rawError.message}`));
}