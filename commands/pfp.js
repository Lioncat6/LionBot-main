const { SlashCommandBuilder, Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pfp')
		.setDescription('Get the avatar URL of the selected user, or your own avatar.')
		.addUserOption(option => option.setName('target').setDescription('The user\'s avatar to show')),
	async execute(interaction) {
		try { await interaction.deferReply(); } catch (error) {throw new Error(error)}
		var user = interaction.options.getUser('target');
		if (!user){
			user = interaction.user
		}
		const pfpEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`${user.displayName}'s avatar`)
            .setDescription(`<@${user.id}>'s avatar`)
			.setURL(user.displayAvatarURL())
			.setImage(user.displayAvatarURL())
			.setTimestamp(Date.now())

        await interaction.editReply({ content: '', embeds: [pfpEmbed]});
	},
};
