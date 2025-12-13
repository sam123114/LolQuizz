import { Events, Message } from 'discord.js';
import * as gameManager from '../managers/game-manager';

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(msg: Message) {
        if (msg.author.bot) {
            return;
        }

        const guildId = msg.guildId;
        if (!guildId) return;

        const gameInstance = gameManager.getGame(guildId);

        if (gameInstance !== undefined && gameInstance.Channel && msg.channel.id == gameInstance.Channel.id) {
            if (gameInstance.State != 'IN_PROGRESS') {
                return;
            }

            //deleting message
            try {
                await msg.delete();
            } catch (e) {
                console.log("Could not delete message: " + e);
            }

            if (!gameInstance.isPlayer(msg.author)) {
                return;
            }

            if (gameInstance.validateResponse(msg.author, msg.content)) {
                //starting next round
                gameInstance.nextRound();
            }

            //updating message
            const result = gameInstance.getCurrentEmbed();

            // Message.edit takes string or MessageEditOptions. result from getCurrentEmbed is InteractionReplyOptions.
            // Structures are similar (embeds, components, files).
            if (gameInstance.Message && typeof gameInstance.Message === 'object' && 'edit' in gameInstance.Message) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (gameInstance.Message as Message).edit(result as any);
            }
        }
    },
};