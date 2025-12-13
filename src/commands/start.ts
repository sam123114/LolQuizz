import { SlashCommandBuilder, ChatInputCommandInteraction, GuildTextBasedChannel } from 'discord.js';
import * as gameManager from '../managers/game-manager';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start a new game of LolQuizz')
        .addStringOption((option) =>
            option
                .setName('mode')
                .setDescription('Used to choose the game mode that you want to play')
                .setRequired(true)
                .addChoices({ name: 'Normal', value: 'normal' }),
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        //we want to add the game to the games array
        const guildId = interaction.guildId;
        if (!guildId || !interaction.channel) {
            return;
        } // Should likely handle DM/missing guild case

        let gameInstance = gameManager.getGame(guildId);

        if (gameInstance !== undefined) {
            await interaction.reply({ content: 'A game is already in progress in this server', ephemeral: true });
            return;
        }

        // Ensure channel is guild-based (not DM)
        if (!('guildId' in interaction.channel)) {
            await interaction.reply({ content: 'This command can only be used in a server channel', ephemeral: true });
            return;
        }

        gameInstance = gameManager.addGame(guildId, interaction.channel as GuildTextBasedChannel);

        //sending embed for game settings
        const result = gameInstance.getCurrentEmbed();
        if (result) {
            // getCurrentEmbed now returns options object, so we spread, or check structure
            // In LolQuizz.ts migration, it returns { embeds: [], components: [], files: [] } or just embeds.
            // Adjusting based on LolQuizz.ts signature
            await interaction.reply(result);
            gameInstance.Message = await interaction.fetchReply();
        } else {
            await interaction.reply({ content: 'An error occured while generating the embed', ephemeral: true });
        }
    },
};
