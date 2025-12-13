import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import * as gameManager from '../managers/game-manager';

module.exports = {
    data: new SlashCommandBuilder().setName('stop').setDescription('End the game'),
    async execute(interaction: ChatInputCommandInteraction) {
        //we want to add the game to the games array
        const guildId = interaction.guildId;
        if (!guildId) return;

        const gameInstance = gameManager.getGame(guildId);

        if (gameInstance === undefined) {
            await interaction.reply({ content: 'There is no game currently in progress', ephemeral: true });
            return;
        }

        gameInstance.stopGame();
        gameManager.clearGame(guildId);

        const result = gameInstance.getCurrentEmbed();
        if (result) {
            await interaction.reply(result);
        } else {
            await interaction.reply({ content: 'An error occured while generating the embed', ephemeral: true });
        }
    },
};