import { Events, ChatInputCommandInteraction } from 'discord.js';
import { QuizzClient } from '../types';

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction: ChatInputCommandInteraction) {
        // In djs v14+, client is on the interaction
        const client = interaction.client as QuizzClient;

        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occured while executing this command!', ephemeral: true });
        }
    },
};