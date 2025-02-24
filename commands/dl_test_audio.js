const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const { pipeline } = require('stream');
const fetch = require('node-fetch');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dl_test_audio')
        .setDescription("This is a test function used to download audio file"),
    async execute(interaction) {
        const url = `https://cdn.communitydragon.org/15.4.1/champion/gnar/champ-select/sounds/choose`;
        const filePath = './test_audio.ogg'

        try {
            console.log(`Downloading: ${url}`);
            const response = await fetch(url);

            if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

            // Save the file
            await streamPipeline(response.body, fs.createWriteStream(filePath));
            console.log('Download complete.');
            interaction.reply({ content: 'Download complete', ephemeral: true });
        } catch (error) {
            console.error('Error downloading or playing file:', error);
            interaction.reply({ content: 'Download failed', ephemeral: true });
            return null;
        }
    },
};