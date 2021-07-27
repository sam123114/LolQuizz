const Discord = require('discord.js');
const champion_data_helper = require('./helpers/champion_data_helper.js');

class LolQuizz {

    get ChannelId() {
        return this.channelId;
    }

    set ChannelId(value) {
        this.channelId = value;
    }

    get Players() {
        return this.players;
    }

    set Players(value) {
        this.players = value;
    }

    get State() {
        return this.state;
    }

    set State(value) {
        this.state = value;
    }

    get GuessedChampion() {
        return this.guessedChampion;
    }

    set GuessedChampion(value) {
        this.guessedChampion = value;
    }

    get Connection() {
        return this.connection;
    }

    set Connection(value) {
        this.connection = value;
    }

    get CurrentChampion() {
        return this.currentChampion;
    }

    set CurrentChampion(value) {
        this.currentChampion = value;
    }

    get Scoreboard() {
        return this.scoreboard;
    }

    set Scoreboard(value) {
        this.scoreboard = value;
    }

    get DiscordClient() {
        return this.discordClient;
    }

    set DiscordClient(value) {
        this.discordClient = value;
    }

    constructor(channelId, discordClient) {
        this.ChannelId = channelId;
        this.Players = [];
        this.State = "IN_CREATION";
        this.GuessedChampion = [];
        this.Connection = null;
        this.CurrentChampion = null;
        this.Scoreboard = null;
        this.DiscordClient = discordClient;
    }

    async updateScoreBoard(channel, start = false) {
        if (this.State == "IN_GAME" && start) {
            let embed = new Discord.MessageEmbed()
            .setTitle('LolQuizz')
            .setColor(0xFF0000)
            let participants = "**Use reactions to execute an action**\n🔄 To replay the current champion's voice line\n⏭ To skip the current champion\n⛔️ To end the game\n**Participants:**\n";
            for (let i = 0; i < Object.keys(this.Players).length; i++) {
                let user = this.DiscordClient.users.cache.get(this.Players[i].userId);
                participants += user.username + " **|** Score: **" + this.Players[i].score + "**\n";
            }
            embed.setDescription(participants);
            this.Scoreboard = await channel.send(embed);
            this.Scoreboard.react("🔄");
            this.Scoreboard.react("⏭");
            this.Scoreboard.react("🚫");
        } else if (this.State == "IN_GAME") {
            let embed = new Discord.MessageEmbed()
            .setTitle('LolQuizz')
            .setColor(0xFF0000)
            let participants = "**Use reactions to execute an action**\n🔄 To replay the current champion's voice line\n⏭ To skip the current champion\n⛔️ To end the game\n**Participants:**\n";
            for (let i = 0; i < Object.keys(this.Players).length; i++) {
                let user = this.DiscordClient.users.cache.get(this.Players[i].userId);
                participants += user.username + " **|** Score: **" + this.Players[i].score + "**\n";
            }
            embed.setDescription(participants);
            this.Scoreboard.edit(embed);
        }
    }

    validateResponse(userId, championName) {
        if (this.State == "IN_GAME") {
            let champ = this.CurrentChampion;
            let res = championName.toLowerCase();
            if (champ.id.toLowerCase() == res || champ.name.toLowerCase() == res) {
                let index = this.players.findIndex(function(value){
                    return value.userId === userId;
                });
                this.Players[index].score += 1;
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    isPlayer(userId) {
        let index = this.players.findIndex(function(value){
            return value.userId === userId;
        });
        return index != -1;
    }

    async startGame(voiceChannel) {
        this.State = "IN_GAME";
        this.Connection = await voiceChannel.join();
        this.nextRound();
    }

    stopGame() {
        this.State = "FINISHED";
        this.Connection.disconnect();
        this.Scoreboard.reactions.removeAll();
    }

    nextRound() {
        if (this.State == "IN_GAME" && this.Connection != null) {
            if (this.CurrentChampion != null) {
                this.GuessedChampion.push(this.CurrentChampion.id);
            }
            this.CurrentChampion = this.pickChampion();
            this.playCurrent();
            return true;
        } else {
            return false;
        }
    }

    playCurrent() {
        if (this.State == "IN_GAME" && this.Connection != null) {
            this.Connection.play(`https://cdn.communitydragon.org/11.15.1/champion/${this.CurrentChampion.id}/champ-select/sounds/choose`);
            console.log(this.CurrentChampion.id);
            return true;
        } else {
            return false;
        }
    }

    pickChampion() {
        let champion = champion_data_helper.selectChampionRandomly();
        //very ugly and must be changed
        while (this.GuessedChampion.indexOf(champion.id) != -1) {
            console.log('oups')
            champion = champion_data_helper.selectChampionRandomly();
        }
        return champion;
    }

    addPlayer(userId) {
        let index = this.players.findIndex(function(value){
            return value.userId === userId;
        });
        if (index == -1) {
            let player_data = {
                userId: userId,
                score: 0
            }
            this.players.push(player_data);
            return true;
        } else {
            return false;
        }
    }

    removePlayer(userId) {
        let index = this.players.findIndex(function(value){
            return value.userId === userId;
        })
        if (index != -1) {
            this.players.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }
}

module.exports.LolQuizz = LolQuizz;