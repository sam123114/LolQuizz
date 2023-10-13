const { SlashCommandBuilder } = require('discord.js');
const gameManager = require('../managers/game-manager.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription("End the game"),
    async execute(interaction) {
        //we want to add the game to the games array
        let guildId = interaction.guildId;
        let gameInstance = gameManager.getGame(guildId);

        if (gameInstance === undefined) {
            interaction.reply({ content: 'There is no game currently in progress', ephemeral: true });
            return;
        }

        gameInstance.stopGame();
        gameManager.clearGame(guildId);

        result = gameInstance.getCurrentEmbed();
        if (result !== false) {
            interaction.reply({ embeds: [result.embed], components: result.actionRow ? [result.actionRow] : [], files: result.files ? [result.files] : [] });
        } else {
            interaction.reply({ content: 'An error occured while generating the embed', ephemeral: true });
        }
    },
};