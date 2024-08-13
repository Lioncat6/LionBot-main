const { SlashCommandBuilder, Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Configure per-server bot settings')
        .addSubcommand((subcommand) =>
			subcommand
				.setName("list")
				.setDescription("List all settings and their values")
		)
        .addSubcommandGroup((subcommand) =>
			subcommand
				.setName("set")
				.setDescription("Sets a setting to a specific value")
				.addSubcommand((subcommand) =>
					subcommand
						.setName("ngguildstatsenabled")
						.setDescription("Enable the displaying of NetherGames guild stats on channels")
						.addBooleanOption((option) => option.setName("enabled").setDescription("Toggle this option").setRequired(true))
				)
                .addSubcommand((subcommand) =>
					subcommand
						.setName("ngguildmemberschannel")
						.setDescription("The channel to display the number of guild members in")
						.addChannelOption((option) => option.setName("channel").setDescription("Channel to display this statistic").setRequired(true))
				)
                .addSubcommand((subcommand) =>
					subcommand
						.setName("ngonlinememberschannel")
						.setDescription("The channel to display the number of online guild members in")
						.addChannelOption((option) => option.setName("channel").setDescription("Channel to display this statistic").setRequired(true))
				)
                .addSubcommand((subcommand) =>
					subcommand
						.setName("ngguildname")
						.setDescription("Associate this discord server with a NetherGames guild name")
						.addStringOption((option) => option.setName("guild").setDescription("Name of the guild on the NetherGames server").setRequired(true))
				)
				
		),
	async execute(interaction) {
		try { await interaction.deferReply(); } catch (error) {throw new Error(error)}

        await interaction.editReply({ content: 'coming soon...'});
	},
};
