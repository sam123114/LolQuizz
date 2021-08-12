const Discord = require('discord.js');
const champion_data_helper = require('./helpers/champion_data_helper.js');

class LolQuizz {

    get Channel() {
        return this.channel;
    }

    set Channel(value) {
        this.channel = value;
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

    get Champions() {
        return this.champions;
    }

    set Champions(value) {
        this.champions = value;
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

    get PreviousChampion() {
        return this.previousChampion;
    }

    set PreviousChampion(value) {
        this.previousChampion = value;
    }

    constructor(channel, discordClient) {
        this.Channel = channel;
        this.Players = [];
        this.State = "IN_CREATION";
        this.Champions = champion_data_helper.getChampions();
        this.Connection = null;
        this.CurrentChampion = null;
        this.Scoreboard = null;
        this.DiscordClient = discordClient;
        this.PreviousChampion = null;
    }

    async updateScoreBoard(channel, start = false, newMessage = true) {
        if (this.State == "IN_GAME") {
            let description = "";
            if (this.PreviousChampion != null) {
                description += "**Previous champion**: " + this.PreviousChampion.name + "\n";
            }
            let embed = new Discord.MessageEmbed()
            .setTitle('LolQuizz')
            .setColor(0xFF0000)
            description += "**Use reactions to execute an action**\n🔄 To replay the current champion's voice line\n⏭ To skip the current champion\n⛔️ To end the game\n**Participants:**\n";
            for (let i = 0; i < Object.keys(this.Players).length; i++) {
                let user = this.DiscordClient.users.cache.get(this.Players[i].userId);
                description += user.username + " **|** Score: **" + this.Players[i].score + "**\n";
            }
            embed.setDescription(description);
            if (start || newMessage) {
                if (!start) {
                    this.Scoreboard.reactions.removeAll();
                }
                this.Scoreboard = await channel.send(embed);
                this.Scoreboard.react("🔄");
                this.Scoreboard.react("⏭");
                this.Scoreboard.react("🚫");
            } else {
                this.Scoreboard.edit(embed);
            }
        } else if (this.State == "FINISHED") {
            if (this.Players.length == 0) {
                return;
            }
            const attachment = new Discord.MessageAttachment('./images/author_logo.jpg', 'author_logo.jpg');
            let embed = new Discord.MessageEmbed()
            .attachFiles(attachment)
            .setTitle('LolQuizz')
            .setColor(0xFF0000)
            .setFooter('By Sam | イボイノシシ#0878', 'attachment://author_logo.jpg');
            let podium = this.Players.sort((a,b) => a.score < b.score && 1 || -1);
            for (let i = 0; i < (podium.length >= 3 ? 3 : podium.length); i++) {
                let user = this.DiscordClient.users.cache.get(this.Players[i].userId);
                let icon = '';
                if (i == 0) icon = '🥇';
                else if (i == 1) icon = '🥈';
                else if (i == 2) icon = '🥉';
                embed.addField(icon + ' ' + user.username, 'Score: **' + podium[i].score + '**', true);
            }
            this.channel.send(embed);
        } else {
            return false;
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
        if (this.Connection != null) {
            this.Connection.disconnect();
            this.Connection = null;
        }
        if (this.Scoreboard != null) {
            this.Scoreboard.reactions.removeAll();
        }
    }

    nextRound() {
        if (this.State == "IN_GAME" && this.Connection != null) {
            if (this.CurrentChampion != null) {
                this.PreviousChampion = this.CurrentChampion;
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
            return true;
        } else {
            return false;
        }
    }

    pickChampion() {
        let champions = Object.keys(this.Champions);
        let championName = champions[Math.floor(Math.random() * champions.length)];
        let champion = this.Champions[championName];
        delete this.Champions[championName];
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