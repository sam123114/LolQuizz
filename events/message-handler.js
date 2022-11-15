const gameManager = require('../managers/game-manager.js');

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(msg) {
        if (msg.author.bot) {
            return;
        }
        let guildId = msg.guildId;
        let gameInstance = gameManager.getGame(guildId);
        if (gameInstance !== false && msg.channel.id == gameInstance.Channel.id) {
            if (gameInstance.State != 'IN_PROGRESS') {
                return;
            }

            //deleting message
            msg.delete();

            if (!gameInstance.isPlayer(msg.author)) {
                return
            }

            if (gameInstance.validateResponse(msg.author.id, msg.content)) {
                //starting next round
                gameInstance.nextRound();

                //updating message
                result = gameInstance.getCurrentEmbed();

                gameInstance.Message.edit({ embeds: [result.embed], components: [result.actionRow] });
            }
        }
    },
};