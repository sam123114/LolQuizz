import { Events, ButtonInteraction, GuildMember } from 'discord.js';
import * as gameManager from '../managers/game-manager';

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;

        const guildId = interaction.guildId;
        if (!guildId) return;

        const gameInstance = gameManager.getGame(guildId);

        if (gameInstance === undefined) {
            await interaction.reply({ content: 'There is no game currently in progress', ephemeral: true });
            return;
        }

        const interactionId = interaction.customId;
        const action = interactionId.split('_')[1];

        // Need to cast member to GuildMember to access voice
        const member = interaction.member as GuildMember;

        if (gameInstance.State == 'IN_CREATION') {
            if (action == 'JOIN') {
                gameInstance.addPlayer(interaction.user);
            } else if (action == 'LEAVE') {
                gameInstance.removePlayer(interaction.user);
            } else if (action == 'START') {
                if (!member.voice.channel) {
                    await interaction.reply({
                        content: 'You need to enter a voice channel in order to start the game',
                        ephemeral: true,
                    });
                    return;
                }
                if (gameInstance.Players.length === 0) {
                    await interaction.reply({
                        content: 'There needs to be at least one player in order to start the game',
                        ephemeral: true,
                    });
                    return;
                }
                await gameInstance.startGame(member.voice.channel);
            } else {
                await interaction.reply({ content: 'An error occured', ephemeral: true });
                return;
            }
        } else if (gameInstance.State == 'IN_PROGRESS') {
            if (action == 'REPLAY') {
                gameInstance.playCurrent();
            } else if (action == 'SKIP') {
                await gameInstance.nextRound();
            } else if (action == 'STOP') {
                gameInstance.stopGame();
                gameManager.clearGame(guildId);
            } else {
                await interaction.reply({ content: 'An error occured', ephemeral: true });
                return;
            }
        } else {
            await interaction.reply({ content: 'An error occured', ephemeral: true });
            return;
        }

        //sending embed for game settings
        const result = gameInstance.getCurrentEmbed();
        if (result) {
            // result is InteractionReplyOptions, so we can pass it directly to update
            // Logic check: getCurrentEmbed() returns files/embeds/components. Update accepts them.
            // However, interaction.update overwrites everything.
            // Need to be careful if result has files, sometimes update with files can be tricky if they are new vs existing.
            // Assuming result structure is compatible.
            // result from LolQuizz ts: { embeds: [...], components: [...], files: [...] }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await interaction.update(result as any);
        } else {
            await interaction.reply({ content: 'An error occured while generating the embed', ephemeral: true });
        }
    },
};