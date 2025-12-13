/**
 * This is a script used to deploy commands to your discord server
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import 'dotenv/config';

const commands: unknown[] = [];
// Adjust path to point to current directory's commands folder
const commandsPath = path.join(__dirname, 'commands');

// In TS source, we look for .ts files. In built JS, they'll be .js. 
// A robust way in dev/prod hybrid is to check extensions.
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const command = require(filePath);
    if (command.data) {
        commands.push(command.data.toJSON());
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN as string);

export function deployCommands(clientId: string, guildId: string): void {
    rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .then(() => console.log(`Successfully registered application commands for guild ID (${guildId})`))
        .catch((err: Error) =>
            console.log(
                `Failed to deploy application commands on guild ID (${guildId}). Error: ${(err as { rawError?: { message?: string } })?.rawError?.message
                }`,
            ),
        );
}