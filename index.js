//Lib
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, ActivityType } = require('discord.js');
const fetch = require("node-fetch");

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,] });

//loading available events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

//loading available commands into the client instance
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
}

//Loading env
require('dotenv').config()

//Loading helpers
const champion_data_helper = require('./helpers/champion_data_helper.js');

//declaring deployer in order to deploy commands to servers
const deployer = require("./deploy-commands.js");

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    //deploying commands
    clientGuilds = client.guilds.cache.map(guild => guild.id);
    clientGuilds.forEach(guildId => {
        deployer.deployCommands(client.user.id, guildId);
    });

    //we want to get the lastest version champion data file from ddragon
    fetch('https://ddragon.leagueoflegends.com/api/versions.json').then(res => res.json()).then(json => {
        console.log("Checking for update");
        champion_data_helper.updateChampionData(json[0]);
    }).catch(console.error);

    client.user.setActivity('Use "/info" for rules and available commands', { type: ActivityType.Custom });
});

client.on("guildCreate", guild => {
    console.log("Joined a new guild: " + guild.name);
    deployer.deployCommands(client.user.id, guild.id);
})

client.login(process.env.DISCORD_TOKEN);