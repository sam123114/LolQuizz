const champion_data_helper = require('./helpers/champion_data_helper.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, userMention } = require('discord.js');
const {
    joinVoiceChannel,
    getVoiceConnection,
    createAudioPlayer,
    createAudioResource,
    entersState,
    VoiceConnectionStatus,
} = require('@discordjs/voice');

class LolQuizz {

    get GameId() {
        return this.gameId;
    }

    set GameId(value) {
        this.gameId = value;
    }

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

    set Champions(value) {
        this.champions = value;
    }

    get AudioPlayer() {
        return this.audioPlayer;
    }

    set AudioPlayer(value) {
        this.audioPlayer = value;
    }

    get CurrentChampion() {
        return this.currentChampion;
    }

    set CurrentChampion(value) {
        this.currentChampion = value;
    }

    get PreviousChampion() {
        return this.previousChampion;
    }

    set PreviousChampion(value) {
        this.previousChampion = value;
    }

    get Message() {
        return this.message;
    }

    set Message(value) {
        this.message = value;
    }

    constructor(gameId, channel) {
        this.GameId = gameId;
        this.Channel = channel;
        this.Players = [];
        this.State = 'IN_CREATION';
        this.Champions = champion_data_helper.getChampions();
        this.AudioPlayer = null;
        this.CurrentChampion = null;
        this.PreviousChampion = null;
        this.Message = null;
        this.guessHistory = [];
    }

    getCurrentEmbed() {
        let description = "";
        let actionRow = null;
        let attachment = null;
        const embed = new EmbedBuilder()
            // .setTitle('LolQuizz')
            .setColor(0xFF0000);
        if (this.State == 'IN_CREATION') {
            //participants section
            description += "**Rules:**\nLolQuizz is a game in which you will hear the quote of a random champion and first person to guess the champion by typing their name correctly in the channel wins.\n**Participants:**\n";
            this.Players.forEach(user => {
                description += `${userMention(user.userId)}\n`;
            });

            //buttons
            actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.GameId}_JOIN`)
                        .setLabel('Join')
                        .setStyle(ButtonStyle.Secondary)
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.GameId}_LEAVE`)
                        .setLabel('Leave')
                        .setStyle(ButtonStyle.Secondary)
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.GameId}_START`)
                        .setLabel('Start the game')
                        .setStyle(ButtonStyle.Success)
                );
        } else if (this.State == 'IN_PROGRESS') {
            //participants section
            description += "**Participants:**\n";
            this.Players.forEach(user => {
                description += `${userMention(user.userId)} **|** Score: **${user.score}**\n`;
            });

            //guess history section
            description += "**Guess History:**\n";
            const guesses = this.getLastGuesses();
            if (guesses.length > 0) {
                let index = 1;
                guesses.forEach((guess) => {
                    let icon = "❌";
                    if (guess.isCorrectAnswer) {
                        icon = "✅";
                    }
                    description += `- ${icon} ${guess.value} (by ${userMention(guess.userId)})\n`;
                    index++;
                })
            } else {
                description += "The last 5 guesses will appear in this section once you start guessing.\n"
            }

            //previous champion section
            description += "**Previous Champion:**\n";
            if (this.PreviousChampion !== null) {
                description += `${this.PreviousChampion.name}\n`;
            } else {
                description += "No previous champion.\n"
            }

            //buttons
            actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.GameId}_REPLAY`)
                        .setLabel('Replay')
                        .setStyle(ButtonStyle.Secondary)
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.GameId}_SKIP`)
                        .setLabel('Skip')
                        .setStyle(ButtonStyle.Secondary)
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.GameId}_STOP`)
                        .setLabel('Stop the game')
                        .setStyle(ButtonStyle.Danger)
                );
        } else if (this.State == 'FINISHED') {
            description = "Thank you for playing LolQuizz! Type **/start** to start a new game.\n**Podium:**";

            //sorting player by points and keeping only the top 3
            let podium = this.Players.sort((a, b) => a.score < b.score && 1 || -1).slice(0, 3);
            let position = 1;
            podium.forEach(player => {
                let icon = '';
                if (position == 1) icon = '🥇';
                else if (position == 2) icon = '🥈';
                else if (position == 3) icon = '🥉';
                embed.addFields({ name: `${icon} ${player.displayName}`, value: `Score: **${player.score}**`, inline: true });
                position++;
            });

            attachment = new AttachmentBuilder('./images/author_logo.jpg');
            embed.setFooter({ text: 'By Sam | イボイノシシ#0878', iconURL: 'attachment://author_logo.jpg' });
        } else {
            return false;
        }

        embed.setDescription(description);

        return { embed: embed, actionRow: actionRow, files: attachment };
    }

    validateResponse(user, championName) {
        if (this.State == "IN_PROGRESS") {
            let userId = user.id;
            let champ = this.CurrentChampion;
            let answer = championName.toLowerCase();

            let isCorrectAnswer = this.isCorrectAnswer(champ, answer);
            this.addGuessToHistory(user, championName, isCorrectAnswer);

            if (isCorrectAnswer) {
                let index = this.Players.findIndex(function (player) {
                    return player.userId === userId;
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

    isCorrectAnswer(champion, answer) {
        return champion.id.toLowerCase() == answer || champion.name.toLowerCase() == answer;
    }

    async startGame(voiceChannel) {
        this.State = "IN_PROGRESS";

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        connection.on('stateChange', (oldState, newState) => {
            console.log('Voice connection state changed from', oldState.status, 'to', newState.status);

            if (oldState.status === VoiceConnectionStatus.Ready && newState.status === VoiceConnectionStatus.Connecting) {
                connection.configureNetworking();
            }
        });

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 30e3);

            this.nextRound();
        } catch (err) {
            connection.destroy();
            console.log(err);
        }
    }

    stopGame() {
        const connection = getVoiceConnection(this.Channel.guildId);

        this.State = "FINISHED";
        if (this.AudioPlayer !== null) {
            this.AudioPlayer.stop();
        }
        if (connection !== undefined) {
            connection.destroy();
        }
    }

    nextRound() {
        const connection = getVoiceConnection(this.Channel.guildId);

        if (this.State == "IN_PROGRESS" && connection != undefined) {
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
        const connection = getVoiceConnection(this.Channel.guildId);
        let version = champion_data_helper.getVersion();

        if (this.State == "IN_PROGRESS" && connection != null) {
            var http = require('http');
            var fs = require('fs');

            var file = fs.createWriteStream("test_audio.ogg");
            var request = http.get("https://cdn.communitydragon.org/${version}/champion/${this.CurrentChampion.id}/champ-select/sounds/choose", function(response) {
                response.pipe(file);
            });
            const voiceLine = createAudioResource(`/home/ec2-user/projects/LolQuizz/test_audio.ogg`);

            if (!this.AudioPlayer) {
                this.AudioPlayer = createAudioPlayer()
                this.AudioPlayer.on('error', (error) => {
                    console.error('Audio player error:', error);
                });
                connection.subscribe(this.AudioPlayer);
            }

            this.AudioPlayer.play(voiceLine);

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

    addPlayer(user) {
        let index = this.players.findIndex(function (value) {
            return value.userId === user.id;
        });
        if (index == -1) {
            let player_data = {
                userId: user.id,
                displayName: user.displayName,
                score: 0
            }
            this.players.push(player_data);
            return true;
        } else {
            return false;
        }
    }

    removePlayer(user) {
        let index = this.players.findIndex(function (value) {
            return value.userId === user.id;
        })
        if (index != -1) {
            this.players.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }

    isPlayer(user) {
        return this.players.findIndex(function (value) {
            return value.userId === user.id;
        }) != -1;
    }

    addGuessToHistory(user, value, isCorrectAnswer) {
        this.guessHistory.push({
            userId: user.id,
            displayName: user.displayName,
            value: value,
            isCorrectAnswer: isCorrectAnswer
        });
    }

    getLastGuesses(numberOfGuesses = 5) {
        const reversedGuessHistory = this.guessHistory.slice().reverse();
        return reversedGuessHistory.slice(0, numberOfGuesses);
    }
}

module.exports.LolQuizz = LolQuizz;