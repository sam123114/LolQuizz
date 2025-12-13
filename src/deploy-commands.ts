/**
 * This is a script used to deploy commands to your discord server
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import logger from './utils/logger';

const commands: unknown[] = [];
// Grab all the command files from the commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        logger.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);

// and deploy your commands!
export async function deployCommands(clientId: string, _guildId: string): Promise<void> {
    try {
        logger.info(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await rest.put(Routes.applicationCommands(clientId), {
            body: commands,
        });

        logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        logger.error(error);
    }
}
