import * as fs from 'node:fs';
import * as path from 'node:path';
import { Client, Collection, GatewayIntentBits, ActivityType, Guild } from 'discord.js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fetch = require('node-fetch');
import 'dotenv/config';
import * as champion_data_helper from './helpers/champion_data_helper';
import * as deployer from './deploy-commands';
import { QuizzClient } from './types';

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

//loading available events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

/* eslint-disable @typescript-eslint/no-require-imports */
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}
/* eslint-enable @typescript-eslint/no-require-imports */

//loading available commands into the client instance
// Extend client type to include commands

(client as QuizzClient).commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

/* eslint-disable @typescript-eslint/no-require-imports */
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    (client as QuizzClient).commands.set(command.data.name, command);
}
/* eslint-enable @typescript-eslint/no-require-imports */

//Listening for new guilds
client.on('guildCreate', (guild: Guild) => {
    console.log('Joined a new guild: ' + guild.name);
    if (client.user) {
        deployer.deployCommands(client.user.id, guild.id);
    }
});

client.on('ready', () => {
    if (!client.user) return;
    console.log(`Logged in as ${client.user.tag}!`);

    //deploying commands
    const clientGuilds = client.guilds.cache.map((guild) => guild.id);
    clientGuilds.forEach((guildId) => {
        if (client.user) {
            deployer.deployCommands(client.user.id, guildId);
        }
    });

    //we want to get the lastest version champion data file from ddragon
    fetch('https://ddragon.leagueoflegends.com/api/versions.json')
        .then((res: { json: () => Promise<string[]> }) => res.json())
        .then((json: string[]) => {
            console.log('Checking for update');
            champion_data_helper.updateChampionData(json[0]);
        })
        .catch(console.error);

    client.user.setActivity('Use "/info" for rules and available commands', { type: ActivityType.Custom });
});

client.login(process.env.DISCORD_TOKEN);