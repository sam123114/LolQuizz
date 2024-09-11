const gameManager = require('../managers/game-manager.js');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        let guildId = interaction.guildId;
        let gameInstance = gameManager.getGame(guildId);

        if (gameInstance === undefined) {
            interaction.reply({ content: 'There is no game currently in progress', ephemeral: true });
            return;
        }

        let interactionId = interaction.customId;
        let action = interactionId.split("_")[1];

        if (gameInstance.State == 'IN_CREATION') {
            if (action == 'JOIN') {
                gameInstance.addPlayer(interaction.user);
            } else if (action == 'LEAVE') {
                gameInstance.removePlayer(interaction.user);
            } else if (action == 'START') {
                if (!interaction.member.voice.channel) {
                    interaction.reply({ content: 'You need to enter a voice channel in order to start the game', ephemeral: true });
                    return;
                }
                if (gameInstance.Players.length === 0) {
                    interaction.reply({ content: 'There needs to be at least one player in order to start the game', ephemeral: true });
                    return;
                }
                gameInstance.startGame(interaction.member.voice.channel);
            } else {
                interaction.reply({ content: 'An error occured', ephemeral: true });
                return;
            }
        } else if (gameInstance.State == 'IN_PROGRESS') {
            if (action == 'REPLAY') {
                gameInstance.playCurrent();
            } else if (action == 'SKIP') {
                gameInstance.nextRound();
            } else if (action == 'STOP') {
                gameInstance.stopGame();
                gameManager.clearGame(guildId);
            } else {
                interaction.reply({ content: 'An error occured', ephemeral: true });
                return;
            }
        } else {
            interaction.reply({ content: 'An error occured', ephemeral: true });
            return;
        }

        //sending embed for game settings
        result = gameInstance.getCurrentEmbed();
        if (result !== false) {
            interaction.update({ embeds: [result.embed], components: result.actionRow ? [result.actionRow] : [], files: result.files ? [result.files] : [] });
        } else {
            interaction.reply({ content: 'An error occured while generating the embed', ephemeral: true });
        }
    },
};