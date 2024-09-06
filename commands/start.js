const { SlashCommandBuilder, Integration } = require('discord.js');
const gameManager = require('../managers/game-manager.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription("Start a new game of LolQuizz")
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Used to choose the game mode that you want to play')
                .setRequired(true)
                .addChoices(
                    { name: 'Normal', value: 'normal' }
                )
        ),
    async execute(interaction) {
        //we want to add the game to the games array
        let guildId = interaction.guildId;
        let gameInstance = gameManager.getGame(guildId);

        if (gameInstance !== undefined) {
            interaction.reply({ content: 'A game is already in progress in this server', ephemeral: true });
            return;
        }

        gameInstance = gameManager.addGame(guildId, interaction.channel);

        //sending embed for game settings
        result = gameInstance.getCurrentEmbed();
        if (result !== false) {
            interaction.reply({ embeds: [result.embed], components: [result.actionRow] });
            gameInstance.Message = await interaction.fetchReply();
        } else {
            interaction.reply({ content: 'An error occured while generating the embed', ephemeral: true });
        }
    },
};