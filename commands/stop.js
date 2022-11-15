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
        if (gameInstance !== false) {
            gameInstance.stopGame();
            gameManager.clearGame(guildId);

            interaction.update({ embeds: [result.embed], components: [result.actionRow] });

            // interaction.reply({ content: 'The game has been stopped' });
        } else {
            interaction.reply({ content: 'There is no game currently in progress', ephemeral: true });
        }
    },
};