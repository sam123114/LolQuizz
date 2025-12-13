// Discord.js command interface
export interface Command {
    data: {
        name: string;
        toJSON: () => unknown;
    };
    execute: (...args: unknown[]) => Promise<void>;
}

// Champion data structures from DDragon API
export interface Champion {
    id: string;
    key: string;
    name: string;
    title: string;
    blurb: string;
    info: {
        attack: number;
        defense: number;
        magic: number;
        difficulty: number;
    };
    image: {
        full: string;
        sprite: string;
        group: string;
        x: number;
        y: number;
        w: number;
        h: number;
    };
    tags: string[];
    partype: string;
    stats: Record<string, number>;
}

export interface ChampionData {
    type: string;
    format: string;
    version: string;
    data: Record<string, Champion>;
}

export interface Champions {
    [key: string]: Champion;
}

import { Client, Collection } from 'discord.js';

export interface QuizzClient extends Client {
    commands: Collection<string, Command>;
}
