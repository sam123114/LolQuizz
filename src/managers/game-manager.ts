import { LolQuizz } from '../lol_quizz';
import { GuildTextBasedChannel } from 'discord.js';

const games: { [key: string]: LolQuizz | undefined } = {};

export function addGame(guildId: string, channel: GuildTextBasedChannel | null): LolQuizz {
    const game = new LolQuizz(guildId, channel);
    games[guildId] = game;
    return game;
}

export function clearGame(guildId: string): void {
    games[guildId] = undefined;
}

export function getGame(guildId: string): LolQuizz | undefined {
    return games[guildId] !== undefined ? games[guildId] : undefined;
}
