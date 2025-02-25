const { SlashCommandBuilder } = require('discord.js');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    VoiceConnectionStatus,
    AudioPlayerStatus,
    StreamType,
    generateDependencyReport
} = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play_audio')
        .setDescription("This is a test function used play remote audio file"),
    async execute(interaction) {
        console.log(generateDependencyReport());
        const resource = createAudioResource('https://cdn.communitydragon.org/15.4.1/champion/gnar/champ-select/sounds/choose',{
            inputType: StreamType.Arbitrary
        });

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

        player.on('stateChange', (oldState, newState) => {
            if (oldState.status !== newState.status) {
                console.log(`Player state changed from ${oldState.status} to ${newState.status}`);
            }
        
            if (newState.status === AudioPlayerStatus.Idle) {
                console.log('Audio finished playing!');
                player.stop();
                connection.destroy();
            }
        });

        if (resource) {
            player.play(resource);
            console.log('Playing audio...');
            interaction.reply({ content: 'Playing audio', ephemeral: true });
        } else {
            console.error('Failed to create audio resource.');
            interaction.reply({ content: 'Failed to create audio resource', ephemeral: true });
        }
    },
};