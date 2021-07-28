//Lib
const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require("node-fetch");
const fs = require('fs');
const path = require('path');
const LolQuizz = require('./lol_quizz.js');

//Loading env
require('dotenv').config()

//Loading helpers
const champion_data_helper = require('./helpers/champion_data_helper.js');

//Array in which we keep the current game for a given channel
let games = [];

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    //we want to get the lastest version file from ddragon
    fetch('https://ddragon.leagueoflegends.com/api/versions.json').then(res => res.json()).then(json => {
        console.log("Checking for update");
        champion_data_helper.updateChampionData(json[0]);
    }).catch(console.error);
});

client.on('message', msg => {
    if(msg.author.bot) return;
    if(msg.channel.type === "dm") return;

    let prefix = process.env.COMMAND_PREFIX;
    let messageArray = msg.content.split(" ");
    let cmd = messageArray[0].toLowerCase();
    let args = messageArray.slice(1);

    if (cmd === prefix + 'info') {
        const embed = new Discord.MessageEmbed()
        .setTitle('LolQuizz')
        .setColor(0xFF0000)
        .setDescription('LolQuizz is a game in which you will hear the quote of a random champion and first person to guess the champion wins.');
        msg.channel.send(embed);
    } else if (cmd === prefix + 'start') {
        let quizz = new LolQuizz.LolQuizz(msg.channel.id, client);
        //we want to add the game to the games array
        let guildId = msg.guild.id;
        if (typeof games[guildId] === 'undefined') {
            games[guildId] = quizz;

            //sending embed for game settings
            const embed = new Discord.MessageEmbed()
            .setTitle('LolQuizz')
            .setColor(0xFF0000)
            .setDescription("**Use reactions to execute an action**\n📥 To join the game\n📤 To leave the game\n🤬 To start the game with the current participants\n**Participants:**\n");
            msg.channel.send(embed).then(message => {
                message.react("📥");
                message.react("📤");
                message.react("🤬");
            });
        } else {
            msg.reply('A game is already in progress for this server');
        }
    } else if ((typeof games[msg.guild.id] !== 'undefined') && games[msg.guild.id].State == "IN_GAME") {
        let guildId = msg.guild.id;
        msg.delete();
        if (games[guildId].isPlayer(msg.author.id)) {
            let res = games[guildId].validateResponse(msg.author.id, cmd);
            if (res) {
                msg.reply('Guessed the answer rights and earned a point', {});
                games[guildId].nextRound();
                games[guildId].updateScoreBoard(msg.channel);
            }
        }
    }
});

client.on('messageReactionAdd', (reaction, user) => {
    // ignore reactions from bots
    if (user.bot) return;

    handleButtons(reaction, user);
});

client.on('messageReactionRemove', (reaction, user) => {
    // ignore reactions from bots
    if (user.bot) return;

    handleButtons(reaction, user);
});

function handleButtons(reaction, user) {
    let update_setup = false;
    let update_game = false;
    let delete_reactions = false;
    let game_over = false;
    let guild = reaction.message.guild
    let game =  games[guild.id];
    let message = reaction.message;

    // detect what reaction and do the right action
    if (reaction.emoji.name == "📥") {
        // we want to add the user
        if (typeof games[guild.id] !== 'undefined') {
            games[guild.id].addPlayer(user.id);
            update_setup = true;
        }
    } else if (reaction.emoji.name == "📤") {
        // we want to remove the user
        if (typeof games[guild.id] !== 'undefined') {
            games[guild.id].removePlayer(user.id);
            update_setup = true;
        }
    } else if (reaction.emoji.name == "🤬") {
        // we want to start the game
        if (typeof games[guild.id] !== 'undefined') {
            let guildMember = guild.members.cache.get(user.id);
            if (guildMember.voice.channel == null) {
                message.channel.send(`<@${user.id}>, You must be in a voice channel in order to start the game`);
                return;
            }
            if (Object.keys(game.Players).length < 1) {
                message.channel.send(`<@${user.id}>, There must be at least one participants in order to start the game`);
                return;
            }

            games[guild.id].startGame(guildMember.voice.channel);
            games[guild.id].updateScoreBoard(message.channel, true);

            delete_reactions = true;
        }
    } else if (reaction.emoji.name == "🔄") {
        // we want to repeat the current voice line
        game.playCurrent();
        game.updateScoreBoard(message.channel, false, false);
    } else if (reaction.emoji.name == "⏭") {
        // we want to skip the current voice line
        game.nextRound();
        game.updateScoreBoard(message.channel);
        update_game = true;
    } else if (reaction.emoji.name == "🚫") {
        // we want to stop the game
        game.stopGame();
        game.updateScoreBoard(message.channel);
        games[guild.id] = undefined;
        game_over = true;
        update_game = true;
        delete_reactions = true;
    }

    if (update_setup) {
        //if there is an update we want to make sure the message is up to date
        let embed = new Discord.MessageEmbed()
            .setTitle('LolQuizz')
            .setColor(0xFF0000)
        let participants = "**Use reactions to execute an action**\n📥 To join the game\n📤 To leave the game\n🤬 To start the game with the current participants\n**Participants:**\n";
        for (let i = 0; i < Object.keys(game.Players).length; i++) {
            let user = client.users.cache.get(game.Players[i].userId);
            participants += user.username + " **|** Score: **" + game.Players[i].score + "**\n";
        }
        embed.setDescription(participants);
        message.edit(embed);
    }
    if (delete_reactions) {
        message.reactions.removeAll();
    }
    if (game_over) {
        games[guild.id] !== undefined;
    }
}
  
client.login(process.env.DISCORD_TOKEN);