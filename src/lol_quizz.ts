import * as champion_data_helper from './helpers/champion_data_helper';
import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder,
    userMention,
    InteractionReplyOptions,
    User,
    VoiceBasedChannel,
    GuildTextBasedChannel,
    APIActionRowComponent,
    APIButtonComponent
} from 'discord.js';
import {
    joinVoiceChannel,
    getVoiceConnection,
    createAudioPlayer,
    createAudioResource,
    entersState,
    VoiceConnectionStatus,
    AudioPlayer,
    StreamType,
} from '@discordjs/voice';
import { Champions, Champion } from './types';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fetch = require('node-fetch');
import { Readable } from 'stream';

interface Player {
    userId: string;
    displayName: string;
    score: number;
}

interface Guess {
    userId: string;
    displayName: string;
    value: string;
    isCorrectAnswer: boolean;
}

export class LolQuizz {
    private gameId: string;
    private channel: GuildTextBasedChannel | null;
    private players: Player[];
    private state: 'IN_CREATION' | 'IN_PROGRESS' | 'FINISHED';
    private champions: Champions;
    private audioPlayer: AudioPlayer | null;
    private currentChampion: Champion | null;
    private previousChampion: Champion | null;
    private currentAudioBuffer: Buffer | null;
    private message: unknown;
    private guessHistory: Guess[];

    constructor(gameId: string, channel: GuildTextBasedChannel | null) {
        this.gameId = gameId;
        this.channel = channel;
        this.players = [];
        this.state = 'IN_CREATION';
        this.champions = champion_data_helper.getChampions();
        this.audioPlayer = null;
        this.audioPlayer = null;
        this.currentChampion = null;
        this.previousChampion = null;
        this.currentAudioBuffer = null;
        this.message = null;
        this.guessHistory = [];
    }

    get GameId(): string {
        return this.gameId;
    }

    set GameId(value: string) {
        this.gameId = value;
    }

    get Channel(): GuildTextBasedChannel | null {
        return this.channel;
    }

    set Channel(value: GuildTextBasedChannel | null) {
        this.channel = value;
    }

    get Players(): Player[] {
        return this.players;
    }

    set Players(value: Player[]) {
        this.players = value;
    }

    get State(): 'IN_CREATION' | 'IN_PROGRESS' | 'FINISHED' {
        return this.state;
    }

    set State(value: 'IN_CREATION' | 'IN_PROGRESS' | 'FINISHED') {
        this.state = value;
    }

    get Champions(): Champions {
        return this.champions;
    }

    set Champions(value: Champions) {
        this.champions = value;
    }

    get AudioPlayer(): AudioPlayer | null {
        return this.audioPlayer;
    }

    set AudioPlayer(value: AudioPlayer | null) {
        this.audioPlayer = value;
    }

    get CurrentChampion(): Champion | null {
        return this.currentChampion;
    }

    set CurrentChampion(value: Champion | null) {
        this.currentChampion = value;
    }

    get PreviousChampion(): Champion | null {
        return this.previousChampion;
    }

    set PreviousChampion(value: Champion | null) {
        this.previousChampion = value;
    }

    get Message(): unknown {
        return this.message;
    }

    set Message(value: unknown) {
        this.message = value;
    }

    getCurrentEmbed(): InteractionReplyOptions {
        let description = '';
        let actionRow: APIActionRowComponent<APIButtonComponent> | null = null;
        let attachment = null;
        const embed = new EmbedBuilder()
            // .setTitle('LolQuizz')
            .setColor(0xff0000);
        if (this.State == 'IN_CREATION') {
            //participants section
            description +=
                '**Rules:**\nLolQuizz is a game in which you will hear the quote of a random champion and first person to guess the champion by typing their name correctly in the channel wins.\n**Participants:**\n';
            this.Players.forEach((user) => {
                description += `${userMention(user.userId)}\n`;
            });

            //buttons
            actionRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.GameId}_JOIN`)
                        .setLabel('Join')
                        .setStyle(ButtonStyle.Secondary),
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.GameId}_LEAVE`)
                        .setLabel('Leave')
                        .setStyle(ButtonStyle.Secondary),
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.GameId}_START`)
                        .setLabel('Start the game')
                        .setStyle(ButtonStyle.Success),
                )
                .toJSON();
        } else if (this.State == 'IN_PROGRESS') {
            //participants section
            description += '**Participants:**\n';
            this.Players.forEach((user) => {
                description += `${userMention(user.userId)} **|** Score: **${user.score}**\n`;
            });

            //guess history section
            description += '**Guess History:**\n';
            const guesses = this.getLastGuesses();
            if (guesses.length > 0) {
                guesses.forEach((guess) => {
                    let icon = '❌';
                    if (guess.isCorrectAnswer) {
                        icon = '✅';
                    }
                    description += `- ${icon} ${guess.value} (by ${userMention(guess.userId)})\n`;
                });
            } else {
                description += 'The last 5 guesses will appear in this section once you start guessing.\n';
            }

            //previous champion section
            description += '**Previous Champion:**\n';
            if (this.PreviousChampion !== null) {
                description += `${this.PreviousChampion.name}\n`;
            } else {
                description += 'No previous champion.\n';
            }

            //buttons
            actionRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.GameId}_REPLAY`)
                        .setLabel('Replay')
                        .setStyle(ButtonStyle.Secondary),
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.GameId}_SKIP`)
                        .setLabel('Skip')
                        .setStyle(ButtonStyle.Secondary),
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${this.GameId}_STOP`)
                        .setLabel('Stop the game')
                        .setStyle(ButtonStyle.Danger),
                )
                .toJSON();
        } else if (this.State == 'FINISHED') {
            description = 'Thank you for playing LolQuizz! Type **/start** to start a new game.\n**Podium:**';

            //sorting player by points and keeping only the top 3
            const podium = this.Players.sort((a, b) => (a.score < b.score && 1) || -1).slice(0, 3);
            let position = 1;
            podium.forEach((player) => {
                let icon = '';
                if (position == 1) icon = '🥇';
                else if (position == 2) icon = '🥈';
                else if (position == 3) icon = '🥉';
                embed.addFields({
                    name: `${icon} ${player.displayName}`,
                    value: `Score: **${player.score}**`,
                    inline: true,
                });
                position++;
            });

            attachment = new AttachmentBuilder('./images/author_logo.jpg');
            embed.setFooter({ text: 'By Sam | イボイノシシ#0878', iconURL: 'attachment://author_logo.jpg' });
        } else {
            // return false; // In TS, returning false here might conflict with return type. Returning empty options or throwing.
            throw new Error('Invalid State');
        }

        embed.setDescription(description);

        if (attachment && actionRow) {
            return { embeds: [embed], components: [actionRow], files: [attachment] };
        }
        if (actionRow) {
            return { embeds: [embed], components: [actionRow] };
        }
        return { embeds: [embed] };
    }

    validateResponse(user: User, championName: string): boolean {
        if (this.State == 'IN_PROGRESS') {
            const userId = user.id;
            const champ = this.CurrentChampion;
            const answer = championName.toLowerCase();

            if (!champ) {
                return false;
            }

            const isCorrectAnswer = this.isCorrectAnswer(champ, answer);
            this.addGuessToHistory(user, championName, isCorrectAnswer);

            if (isCorrectAnswer) {
                const index = this.Players.findIndex(function (player) {
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

    isCorrectAnswer(champion: Champion, answer: string): boolean {
        return champion.id.toLowerCase() == answer || champion.name.toLowerCase() == answer;
    }

    async startGame(voiceChannel: VoiceBasedChannel): Promise<void> {
        this.State = 'IN_PROGRESS';

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            adapterCreator: voiceChannel.guild.voiceAdapterCreator as any, // Type mismatch between discord.js and @discordjs/voice
        });

        connection.on('stateChange', (oldState, newState) => {
            console.log('Voice connection state changed from', oldState.status, 'to', newState.status);

            if (
                oldState.status === VoiceConnectionStatus.Ready &&
                newState.status === VoiceConnectionStatus.Connecting
            ) {
                connection.configureNetworking();
            }
        });

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

            await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

            await this.nextRound();
        } catch (err) {
            connection.destroy();
            console.log(err);
        }
    }

    stopGame(): void {
        if (!this.Channel) {
            return;
        }
        const connection = getVoiceConnection(this.Channel.guildId);

        this.State = 'FINISHED';
        if (this.AudioPlayer !== null) {
            this.AudioPlayer.stop();
        }
        if (connection !== undefined) {
            connection.destroy();
        }
    }

    async nextRound(): Promise<boolean> {
        if (!this.Channel) {
            return false;
        }
        const connection = getVoiceConnection(this.Channel.guildId);

        if (this.State == 'IN_PROGRESS' && connection != undefined) {
            if (this.CurrentChampion != null) {
                this.PreviousChampion = this.CurrentChampion;
            }
            this.CurrentChampion = this.pickChampion();

            // Fetch and buffer audio
            try {
                const version = champion_data_helper.getVersion();
                const url = `https://cdn.communitydragon.org/${version}/champion/${this.CurrentChampion.id}/champ-select/sounds/choose`;
                const response = await fetch(url);
                if (response.ok) {
                    this.currentAudioBuffer = await response.buffer();
                } else {
                    console.error(`Failed to fetch audio for ${this.CurrentChampion.id}: ${response.statusText}`);
                    this.currentAudioBuffer = null;
                }
            } catch (error) {
                console.error('Error fetching audio:', error);
                this.currentAudioBuffer = null;
            }

            this.playCurrent();
            return true;
        } else {
            return false;
        }
    }

    playCurrent(): boolean {
        if (!this.Channel || !this.CurrentChampion || !this.currentAudioBuffer) {
            return false;
        }
        const connection = getVoiceConnection(this.Channel.guildId);

        if (this.State == 'IN_PROGRESS' && connection) {
            const stream = Readable.from(this.currentAudioBuffer);
            const voiceLine = createAudioResource(stream, {
                inputType: StreamType.Arbitrary,
            });

            if (!this.AudioPlayer) {
                this.AudioPlayer = createAudioPlayer();
                connection.subscribe(this.AudioPlayer);
            }

            this.AudioPlayer.play(voiceLine);

            return true;
        } else {
            return false;
        }
    }

    pickChampion(): Champion {
        const champions = Object.keys(this.Champions);
        const championName = champions[Math.floor(Math.random() * champions.length)];
        const champion = this.Champions[championName];
        delete this.Champions[championName];
        return champion;
    }

    addPlayer(user: User): boolean {
        const index = this.players.findIndex(function (value) {
            return value.userId === user.id;
        });
        if (index == -1) {
            const player_data: Player = {
                userId: user.id,
                displayName: user.displayName, // displayName might not exist on User, but on GuildMember. Double check later.
                score: 0,
            };
            this.players.push(player_data);
            return true;
        } else {
            return false;
        }
    }

    removePlayer(user: User): boolean {
        const index = this.players.findIndex(function (value) {
            return value.userId === user.id;
        });
        if (index != -1) {
            this.players.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }

    isPlayer(user: User): boolean {
        return (
            this.players.findIndex(function (value) {
                return value.userId === user.id;
            }) != -1
        );
    }

    addGuessToHistory(user: User, value: string, isCorrectAnswer: boolean): void {
        this.guessHistory.push({
            userId: user.id,
            displayName: user.displayName,
            value: value,
            isCorrectAnswer: isCorrectAnswer,
        });
    }

    getLastGuesses(numberOfGuesses = 5): Guess[] {
        const reversedGuessHistory = this.guessHistory.slice().reverse();
        return reversedGuessHistory.slice(0, numberOfGuesses);
    }
}