const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription("Used to get more information about the game and the rules"),
    async execute(interaction) {
        const attachment = new AttachmentBuilder('./images/author_logo.jpg');
        const infoEmbed = new EmbedBuilder()
            .setTitle('LolQuizz')
            .setColor(0xFF0000)
            .setDescription('**Rules:**\nLolQuizz is a game in which you will hear the quote of a random champion and first person to guess the champion by typing their name correctly in the channel wins.\n**Commands:**\n🔸 **/info** Rules and list of command\n🔸 **/start** Start a new game\n🔸 **/stop** End the game')
            .setFooter({ text: 'By Sam | イボイノシシ#0878', iconURL: 'attachment://author_logo.jpg' });
        interaction.reply({ embeds: [infoEmbed], files: [attachment] });
    },
};