const { SlashCommandBuilder, Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('role')
		.setDescription('Get information of selected role')
		.addRoleOption(option => option.setName('role').setDescription('The selected role').setRequired(true)),
	async execute(interaction) {
		const role = interaction.option.getRole('role');
        await interaction.reply({ content: 'Coming Soon...', ephemeral: true });
	},
};
