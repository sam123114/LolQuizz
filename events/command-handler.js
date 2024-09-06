module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction) {
        const client = interaction.client;

        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occured while executing this command!', ephemeral: true });
        }
    },
};