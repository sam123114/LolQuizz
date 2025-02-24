const { SlashCommandBuilder } = require('discord.js');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
} = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play_test_audio')
        .setDescription("This is a test function used play downloaded audio file"),
    async execute(interaction) {
        const filePath = './test_audio.ogg'
        const resource = createAudioResource(filePath);

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.member.voice.channel.guild.id,
            adapterCreator: interaction.member.voice.channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        connection.subscribe(player);

        connection.on('stateChange', (oldState, newState) => {
            console.log('Voice connection state changed from', oldState.status, 'to', newState.status);

            if (oldState.status === VoiceConnectionStatus.Ready && newState.status === VoiceConnectionStatus.Connecting) {
                connection.configureNetworking();
            }
        });

        player.on('error', (error) => {
            console.error('Audio player error:', error);
        });

        if (resource) {
            player.play(resource);
            console.log('Playing audio...');
        } else {
            console.error('Failed to create audio resource.');
        }

        player.stop();
        connection.destroy();
    },
};