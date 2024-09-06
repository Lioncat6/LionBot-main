const { SlashCommandBuilder, Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField  } = require("discord.js");
const Guild = require("../db/Guild.js");
const { ngToken } = require("../config.json");
const permissionHandler = require("../scripts/permissionHandler.js");

const fetchHeaders = new Headers();
fetchHeaders.append("Content-Type", "application/json");
fetchHeaders.append("Authorization", `${ngToken}`);

module.exports = {
	data: new SlashCommandBuilder()
		.setName("settings")
		.setDescription("Configure per-server bot settings")
		.addSubcommand((subcommand) => subcommand.setName("list").setDescription("List all settings and their values"))
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
						.setName("nggxpchannel")
						.setDescription("The channel to display the amount of gxp the guild has")
						.addChannelOption((option) => option.setName("channel").setDescription("Channel to display this statistic").setRequired(true))
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("nglevelchannel")
						.setDescription("The channel to display the level the guild is")
						.addChannelOption((option) => option.setName("channel").setDescription("Channel to display this statistic").setRequired(true))
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("ngrankchannel")
						.setDescription("The channel to display the leaderboard rank the guild is")
						.addChannelOption((option) => option.setName("channel").setDescription("Channel to display this statistic").setRequired(true))
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("nggxptonextlevelchannel")
						.setDescription("The channel to display the amount of gxp to the next guild level")
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
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			throw new Error(error);
		}
		if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild) || permissionHandler.checkOverride(interaction.member.id)) {
			if (interaction.inGuild() && interaction.guild) {
				const guildId = interaction.guild.id;
				const guildName = interaction.guild.name;
				let guild = await Guild.findOne({ where: { discordId: guildId } });

				if (guild) {
				} else {
					// Create the user if they don't exist
					guild = await Guild.create({ discordId: guildId, name: guildName });
					console.log("Database Entry Created:", guild.toJSON());
				}
				if (interaction.options.getSubcommand() == "ngguildname") {
					const ngGuild = interaction.options.getString("guild");
					const response = await fetch(`https://api.ngmc.co/v1/guilds/${ngGuild}?expand=true`, {
						method: "GET",
						headers: fetchHeaders,
					});
					if (!response.ok) {
						if (response.status == 404) {
							const playerNotFoundEmbed = new EmbedBuilder().setColor(0xff0000).setTitle(`Guild Not Found ❌`);
							await interaction.editReply({
								content: "",
								embeds: [playerNotFoundEmbed],
								ephemeral: true,
							});
							setTimeout(async () => {try{ await interaction.deleteReply() } catch {}}, 10000);
						} else {
							const ngErrEmbed = new EmbedBuilder().setColor(0xff0000).setTitle(`API Error ❌`).setDescription(String(response.status));
							await interaction.editReply({
								content: "",
								embeds: [ngErrEmbed],
								ephemeral: true,
							});
							setTimeout(async () => {try{ await interaction.deleteReply() } catch {}}, 10000);
						}
					} else {
						guild.ngguildname = ngGuild;
						await guild.save();
						await interaction.editReply({ content: `Set \`${interaction.options.getSubcommand()}\` to \`${ngGuild}\`!` });
					}
				} else if (interaction.options.getSubcommand() == "ngonlinememberschannel") {
					
					let channel = interaction.options.getChannel("channel");
					let channelId = channel.id;
					let botPermissions = channel.permissionsFor(interaction.client.user);
					if (botPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
						guild.ngonlinememberschannel = channelId;
						await guild.save();
						await interaction.editReply({ content: `Set \`${interaction.options.getSubcommand()}\` to \`${channelId}\` <#${channelId}>!` });
					} else {
						await interaction.editReply({ content: `Bot does not have permissions to manage this channel!` });
					}
					
				} else if (interaction.options.getSubcommand() == "ngguildmemberschannel") {
					let channel = interaction.options.getChannel("channel");
					let channelId = channel.id;
					let botPermissions = channel.permissionsFor(interaction.client.user);
					if (botPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
						guild.ngguildmemberschannel = channelId;
						await guild.save();
						await interaction.editReply({ content: `Set \`${interaction.options.getSubcommand()}\` to \`${channelId}\` <#${channelId}>!` });
					} else {
						await interaction.editReply({ content: `Bot does not have permissions to manage this channel!` });
					}
				} else if (interaction.options.getSubcommand() == "nggxpchannel") {
					let channel = interaction.options.getChannel("channel");
					let channelId = channel.id;
					let botPermissions = channel.permissionsFor(interaction.client.user);
					if (botPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
						guild.nggxpchannel = channelId;
						await guild.save();
						await interaction.editReply({ content: `Set \`${interaction.options.getSubcommand()}\` to \`${channelId}\` <#${channelId}>!` });
					} else {
						await interaction.editReply({ content: `Bot does not have permissions to manage this channel!` });
					}
				} else if (interaction.options.getSubcommand() == "nglevelchannel") {
					let channel = interaction.options.getChannel("channel");
					let channelId = channel.id;
					let botPermissions = channel.permissionsFor(interaction.client.user);
					if (botPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
						guild.nglevelchannel = channelId;
						await guild.save();
						await interaction.editReply({ content: `Set \`${interaction.options.getSubcommand()}\` to \`${channelId}\` <#${channelId}>!` });
					} else {
						await interaction.editReply({ content: `Bot does not have permissions to manage this channel!` });
					}
				} else if (interaction.options.getSubcommand() == "ngrankchannel") {
					let channel = interaction.options.getChannel("channel");
					let channelId = channel.id;
					let botPermissions = channel.permissionsFor(interaction.client.user);
					if (botPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
						guild.ngrankchannel = channelId;
						await guild.save();
						await interaction.editReply({ content: `Set \`${interaction.options.getSubcommand()}\` to \`${channelId}\` <#${channelId}>!` });
					} else {
						await interaction.editReply({ content: `Bot does not have permissions to manage this channel!` });
					}
				} else if (interaction.options.getSubcommand() == "nggxptonextlevelchannel") {
					let channel = interaction.options.getChannel("channel");
					let channelId = channel.id;
					let botPermissions = channel.permissionsFor(interaction.client.user);
					if (botPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
						guild.nggxptonextlevelchannel = channelId;
						await guild.save();
						await interaction.editReply({ content: `Set \`${interaction.options.getSubcommand()}\` to \`${channelId}\` <#${channelId}>!` });
					} else {
						await interaction.editReply({ content: `Bot does not have permissions to manage this channel!` });
					}
				} else if (interaction.options.getSubcommand() == "ngguildstatsenabled") {
					const toggle = interaction.options.getBoolean("enabled");
					guild.ngguildstatsenabled = toggle;
					await guild.save();
					await interaction.editReply({ content: `Set \`${interaction.options.getSubcommand()}\` to \`${toggle}\`!` });
				} else if (interaction.options.getSubcommand() == "list") {
					let toPrint = "";
					let embedFields = [];
					let blacklistedAttributes = ["id", "discordId", "name", "createdAt", "updatedAt"];
					let guildJson = guild.toJSON();
					for (var attributeName in guildJson) {
						if (blacklistedAttributes.indexOf(attributeName) == -1) {
							if (guildJson[attributeName] == null) {
								embedFields.push({ name: attributeName, value: `Unset` });
							} else {
								if (attributeName.includes("channel")) {
									embedFields.push({ name: attributeName, value: `${guildJson[attributeName]} <#${guildJson[attributeName]}>` });
								} else {
									embedFields.push({ name: attributeName, value: `${guildJson[attributeName]}` });
								}
							}
						}
					}
					const settingsEmbed = new EmbedBuilder().setColor(0x0099ff).setTitle(`Guild Settings`).setDescription("Displays all Guild Settings and their current values").addFields(embedFields).setFooter({
						text: "To change settings, use /settings set <setting>",
					});
					await interaction.editReply({ content: "", embeds: [settingsEmbed] });
				} else {
					await interaction.editReply({ content: "coming soon..." });
				}
			} else if (interaction.inGuild()) {
				await interaction.editReply({ content: "This command only works in guilds the bot has permissions in!", ephemeral: true });
			} else {
				await interaction.editReply({ content: "This command only works in guilds!", ephemeral: true });
			}
		} else {
			const noPermsEmbed = new EmbedBuilder().setColor(0xff0000).setTitle(`You do not have the permission \`Manage Guild\`! ❌`);
			await interaction.editReply({
				content: "",
				embeds: [noPermsEmbed],
				ephemeral: true,
			});
			setTimeout(async () => {try{ await interaction.deleteReply() } catch {}}, 10000);
		}
	},
};
