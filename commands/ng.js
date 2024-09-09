const { SlashCommandBuilder, Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require("discord.js");
var request = require("request").defaults({ encoding: null });
const { ngToken } = require("../config.json");
const playerPicture = require("../scripts/generatePlayerpicture.js");

const fetchHeaders = new Headers();
fetchHeaders.append("Content-Type", "application/json");
fetchHeaders.append("Authorization", `${ngToken}`);

const playerPictureCooldowns = new Set();

function format_seconds(minutes) {
	const weeks = Math.floor(minutes / 10080); // 1 week = 7 days * 24 hours * 60 minutes
	const days = Math.floor((minutes % 10080) / 1440); // 1 day = 24 hours * 60 minutes
	const hours = Math.floor((minutes % 1440) / 60);
	const remainingMinutes = minutes % 60;
	return `${weeks}W ${days}D ${hours}H ${remainingMinutes}M`;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ng")
		.setDescription("NetherGames master command")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("stats")
				.setDescription("Fetch player stats")
				.addStringOption((option) => option.setName("ign").setDescription("Name of the player on the NetherGames server").setRequired(true))
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("guild")
				.setDescription("Fetch player stats")
				.addStringOption((option) => option.setName("guild").setDescription("Name of the guild on the NetherGames server").setRequired(true))
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("guildleaderboard")
				.setDescription("Fetch top players in a guild for a given statistic and period")
				.addStringOption((option) => option.setName("guild").setDescription("Name of the guild on the NetherGames server").setRequired(true))
				.addStringOption((option) =>
					option
						.setName("statistic")
						.setDescription("The selected statistic")
						.setRequired(true)
						.addChoices({ name: "Kills", value: "kills" }, { name: "K/DR", value: "kdr" }, { name: "Wins", value: "wins" }, { name: "W/LR", value: "wlr" }, { name: "GXP", value: "gxp" })
				)
				.addStringOption((option) =>
					option
						.setName("period")
						.setDescription("Time period of stats to fetch")
						.setRequired(false)
						.addChoices(
							{ name: "Global (All Time)", value: "global" },
							{ name: "Daily", value: "daily" },
							{ name: "Weekly", value: "weekly" },
							{ name: "Bi-Weekly", value: "biweekly" },
							{ name: "Monthly", value: "monthly" },
							{ name: "Yearly", value: "yearly" }
						)
				)
		)
		.addSubcommandGroup((subcommand) =>
			subcommand
				.setName("roles")
				.setDescription("Nethetgames role command")
				.addSubcommand((subcommand) =>
					subcommand
						.setName("claim")
						.setDescription("Claim roles depending on your NetherGames stats")
						.addStringOption((option) => option.setName("ign").setDescription("Your name on the NetherGames server").setRequired(true))
				)
				.addSubcommand((subcommand) => subcommand.setName("settings").setDescription("Configure roles for this command"))
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("info")
				.setDescription("Fetch player info")
				.addStringOption((option) => option.setName("ign").setDescription("Name of the player on the NetherGames server").setRequired(true))
		)

		.addSubcommand((subcommand) =>
			subcommand
				.setName("skin")
				.setDescription("Fetches the player skin")
				.addStringOption((option) => option.setName("ign").setDescription("Name of the player on the NetherGames server").setRequired(true))
				.addBooleanOption((option) => option.setName("render").setDescription("Should the skin be rendered in 3d?").setRequired(true))
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("punishments")
				.setDescription("Fetch player Punishments")
				.addStringOption((option) => option.setName("ign").setDescription("Name of the player on the NetherGames server").setRequired(true))
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("gstats")
				.setDescription("Fetch player game stats")
				.addStringOption((option) => option.setName("ign").setDescription("Name of the player on the NetherGames server").setRequired(true))
				.addStringOption((option) =>
					option
						.setName("game")
						.setDescription("The selected Game Mode")
						.setRequired(true)
						.addChoices(
							{ name: "Skywars", value: "skywars" },
							{ name: "Bedwars", value: "bedwars" },
							{ name: "Survival Games", value: "survivalGames" },
							{ name: "Duels", value: "duels" },
							{ name: "The Bridge", value: "bridge" },
							{ name: "Murder Mystery", value: "murderMystery" },
							{ name: "Conquests", value: "conquests" },
							{ name: "Factions", value: "factions" },
							{ name: "UHC", value: "UHC" },
							{ name: "Soccer", value: "soccer" },
							{ name: "Momma Says", value: "mommaSays" }
						)
				)
				.addStringOption((option) =>
					option
						.setName("period")
						.setDescription("Time period of stats to fetch")
						.setRequired(false)
						.addChoices(
							{ name: "Global (All Time)", value: "global" },
							{ name: "Daily", value: "daily" },
							{ name: "Weekly", value: "weekly" },
							{ name: "Bi-Weekly", value: "biweekly" },
							{ name: "Monthly", value: "monthly" },
							{ name: "Yearly", value: "yearly" }
						)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("playerpicture")
				.setDescription("Generate player picture")
				.addStringOption((option) => option.setName("ign").setDescription("Name of the player on the NetherGames server").setRequired(true))
				.addStringOption((option) => option.setName("options").setDescription("For developmental purposes"))
		)
		.addSubcommand((subcommand) => subcommand.setName("online").setDescription("Fetch online player count"))
		.addSubcommand((subcommand) => subcommand.setName("ping").setDescription("Check NetherGames API latency")),
	async execute(interaction) {
		function truncateToThreeDecimals(number) {
			return Math.trunc(number * 1000) / 1000;
		}
		try {
			await interaction.deferReply();
		} catch (error) {
			throw new Error(error);
		}
		try {
			if (interaction.options.getSubcommand() == "online") {
				const response = await fetch("https://api.ngmc.co/v1/servers/ping", {
					method: "GET",
					headers: fetchHeaders,
				});
				if (!response.ok) {
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				const json = await response.json();
				const onlineEmbed = new EmbedBuilder()
					.setColor(0xd79b4e)
					.setTitle(`${json["players"]["online"]} Online Players`)
					.setDescription(`There are ${json["players"]["online"]}/${json["players"]["max"]} players online`)
					.setThumbnail("https://avatars.githubusercontent.com/u/26785598?s=280&v=4");
				await interaction.editReply({ embeds: [onlineEmbed] });
			} else if (interaction.options.getSubcommand() == "ping") {
				await interaction.editReply({ content: "Pinging endpoint 1/5... (`/servers/ping`)" });
				const t1 = Date.now();
				const response = await fetch("https://api.ngmc.co/v1/servers/ping", {
					method: "GET",
					headers: fetchHeaders,
				});
				if (!response.ok) {
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				const t2 = Date.now();
				await interaction.editReply({ content: "Pinging endpoint 2/5... (`/players`)" });
				const response2 = await fetch("https://api.ngmc.co/v1/players/Lioncat6", {
					method: "GET",
					headers: fetchHeaders,
				});
				if (!response2.ok) {
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				const t3 = Date.now();
				await interaction.editReply({ content: "Pinging endpoint 3/5... (`/guilds`)" });
				const response3 = await fetch("https://api.ngmc.co/v1/guilds/cosmic", {
					method: "GET",
					headers: fetchHeaders,
				});
				if (!response3.ok) {
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				const t4 = Date.now();
				await interaction.editReply({ content: "Pinging endpoint 4/5... (`/players/*?period=monthly`)" });
				const response4 = await fetch("https://api.ngmc.co/v1/players/Lioncat6?period=monthly", {
					method: "GET",
					headers: fetchHeaders,
				});
				if (!response4.ok) {
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				let description = "";
				let color = "";
				if (t2 - t1 <= 1700) {
					description = `${t2 - t1}ms (fast)`;
					color = 0x00ff00;
				} else if (t2 - t1 > 1700) {
					description = `${t2 - t1}ms (normal)`;
					color = 0xdaff00;
				} else if (t2 - t1 > 2800) {
					description = `${t2 - t1}ms (slow)`;
					color = 0xffa700;
				} else if (t2 - t1 > 5000) {
					description = `${t2 - t1}ms (really slow)`;
					color = 0xff2100;
				} else if (t2 - t1 > 8000) {
					description = `${t2 - t1}ms (💀 having a bad time...)`;
					color = 0x000000;
				}
				const onlineEmbed = new EmbedBuilder().setColor(color).setTitle(`NetherGames API Latency`).setDescription(description).setThumbnail("https://avatars.githubusercontent.com/u/26785598?s=280&v=4");
				await interaction.editReply({ embeds: [onlineEmbed] });
			} else if (interaction.options.getSubcommand() == "playerpicture") {
				if (!playerPictureCooldowns.has(interaction.user.id)) {
					const t1 = Date.now();
					interaction.editReply({ content: "Fetching stats... (1/3)" });
					const playername = interaction.options.getString("ign");
					let options = interaction.options.getString("options");
					let transparent = false;
					let unbaked = false;
					if (!options) {
						options = "none";
					}
					if (options.toLowerCase().includes("transparent")) {
						transparent = true;
					}
					if (options.toLowerCase().includes("unbaked")) {
						unbaked = true;
					}
					const render = true;
					const response = await fetch(`https://api.ngmc.co/v1/players/${playername}?withWinStreaks=true&withGuildData=true`, {
						method: "GET",
						headers: fetchHeaders,
					});
					if (!response.ok) {
						if (response.status == 404) {
							throw new Error(`Player not found!`);
						}
						throw new Error(`NetherGames api error: ${response.status}`);
					}
					let json;
					json = await response.json();
					var skinUrl = json["skin"];
					interaction.editReply({ content: "Fetching stats... (2/3)" });
					const monthlyResponse = await fetch(`https://api.ngmc.co/v1/players/${playername}?period=monthly`, {
						method: "GET",
						headers: fetchHeaders,
					});

					if (!monthlyResponse.ok) {
						if (monthlyResponse.status == 404) {
							throw new Error(`Player not found!`);
						}
						throw new Error(`NetherGames api error: ${monthlyResponse.status}`);
					}
					let monthly;
					monthly = await monthlyResponse.json();
					interaction.editReply({ content: "Fetching stats... (3/3)" });
					const weeklyResponse = await fetch(`https://api.ngmc.co/v1/players/${playername}?period=weekly`, {
						method: "GET",
						headers: fetchHeaders,
					});
					if (!weeklyResponse.ok) {
						if (weeklyResponse.status == 404) {
							throw new Error(`Player not found!`);
						}
						throw new Error(`NetherGames api error: ${weeklyResponse.status}`);
					}
					let weekly;
					weekly = await weeklyResponse.json();
					playerPictureCooldowns.add(interaction.user.id);
					setTimeout(() => {
						playerPictureCooldowns.delete(interaction.user.id);
					}, 30000);
					let playerPictureBuffer;
					const t2 = Date.now();
					let t3;
					interaction.editReply({ content: "Downloading skin..." });
					if (json["skinVisibility"]) {
						const skinResponse = await fetch(skinUrl);
						if (skinResponse.status === 200) {
							const blob = await skinResponse.arrayBuffer();
							const data = await Buffer.from(blob);
							const base64Data = await data.toString("base64");
							const fullSkinUrl = `https://vzge.me/full/832/${base64Data}`;
							async function downloadSkin(url) {
								const headers = new Headers({
									"User-Agent": "LionBot-Discord-Bot <lioncat6pmc@gmail.com>", // Your custom User-Agent string
									Accept: "application/json",
									"Content-Type": "application/json",
								});

								const skinDataResponse = await fetch(url, {
									method: "GET",
									headers: headers,
								});

								if (skinDataResponse.ok) {
									const buffer = await skinDataResponse.arrayBuffer();
									return buffer; // This is the image data in a Buffer
								} else {
									throw new Error("Skin API error:", skinDataResponse.status);
									return null;
								}
							}
							t3 = Date.now();
							interaction.editReply({ content: "Rendering Picture..." });
							playerPictureBuffer = await playerPicture.createPlayerPictureText(json, monthly, weekly, Buffer.from(await downloadSkin(fullSkinUrl)), transparent, unbaked);
						} else {
							throw new Error(`NetherGames api error: ${response.status}`);
						}
					} else {
						t3 = Date.now();
						interaction.editReply({ content: "Rendering Picture..." });
						playerPictureBuffer = await playerPicture.createPlayerPictureText(json, monthly, weekly, undefined, transparent, unbaked);
					}

					const file = new AttachmentBuilder(playerPictureBuffer);
					file.name = "playerPicture.png";
					const playerPictureEmbed = new EmbedBuilder()
						.setColor(0xd79b4e)
						.setTitle(`${json["name"]}'s Player Picture`)
						.addFields(
							{
								name: "API Fetch Time:",
								value: `${t2 - t1}ms`,
							},
							{
								name: "Skin Fetch Time:",
								value: `${t3 - t2}ms`,
							},
							{
								name: "Picture Render Time:",
								value: `${Date.now() - t3}ms`,
							}
						)
						.setThumbnail(json["avatar"])
						.setImage(`attachment://playerPicture.png`)
						.setTimestamp(Date.now());

					await interaction.editReply({ content: "", embeds: [playerPictureEmbed], files: [file] });
				} else {
					await interaction.editReply({ content: "Please wait 30 seconds before running this command again." });
					setTimeout(async () => {
						try {
							await interaction.deleteReply();
						} catch {}
					}, 10000);
				}
			} else if (interaction.options.getSubcommand() == "stats") {
				const playername = interaction.options.getString("ign");
				const response = await fetch(`https://api.ngmc.co/v1/players/${playername}`, {
					method: "GET",
					headers: fetchHeaders,
				});
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Player not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				let json;
				json = await response.json();
				var tier = json["tier"];
				if (!tier) {
					tier = "none";
				}
				const statsEmbed = new EmbedBuilder()
					.setColor(0xd79b4e)
					.setTitle(`${json["name"]}'s Player Stats`)
					//.setDescription(json["bio"])
					.addFields(
						{
							name: "Level",
							value: `${json["level"]} (${json["xpToNextLevel"]} xp to ${json["level"] + 1})`,
						},
						{
							name: "Xp",
							value: `${json["xp"]}`,
						},
						{
							name: "Kills",
							value: `${json["kills"]}`,
						},
						{
							name: "Deaths",
							value: `${json["deaths"]}`,
						},
						{
							name: "K/DR",
							value: `${json["kdr"]}`,
						},
						{
							name: "Wins",
							value: `${json["wins"]}`,
						},
						{
							name: "Losses",
							value: `${json["losses"]}`,
						},
						{
							name: "W/LR",
							value: `${truncateToThreeDecimals(json["wins"] / json["losses"])}`,
						},
						{
							name: "Credits",
							value: `${json["credits"]} (${tier})`,
						},
						{
							name: "Crate Keys",
							value: `${json["crateKeys"]}`,
						},
						{
							name: "Playtime",
							value: `${format_seconds(json["extraNested"]["online"]["time"])} (${Math.floor(json["extraNested"]["online"]["time"] / 60)} hours)`,
						}
					)
					.setThumbnail(json["avatar"])
					.setTimestamp(Date.now());
				await interaction.editReply({ embeds: [statsEmbed] });
			} else if (interaction.options.getSubcommand() == "guild") {
				const guildName = interaction.options.getString("guild");
				const response = await fetch(`https://api.ngmc.co/v1/guilds/${guildName}?expand=true`, {
					method: "GET",
					headers: fetchHeaders,
				});
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Guild not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				let json;
				json = await response.json();
				let position = json["position"];
				if (position < 1 || !position) {
					position = "Not Ranked";
				}
				let color = 0xd79b4e;
				if (json["tagColor"]) {
					color = parseInt(json["tagColor"].slice(1), 16);
				}
				let motd = json["motd"];
				if (!json["motd"] || json["motd"] == "") {
					motd = " - ";
				}
				let onlineCount = 0;
				let membersString = "";
				let leaderString = "";
				let officerString = "";
				if (json["leader"]) {
					const leader = json["leader"];
					let lUrl = `https://ngmc.co/p/${leader["name"]}`;
					lUrl = lUrl.replace(/ /g, "%20");
					if (leader["online"]) {
						onlineCount = onlineCount + 1;
						let locationString = "Location Hidden";
						if (leader["lastServerParsed"]) {
							locationString = leader["lastServerParsed"]["pretty"];
						}
						leaderString = `[${leader["name"]}](${lUrl}) 🟢\n[**${locationString}**]`;
					} else {
						leaderString = `[${leader["name"]}](${lUrl}) 🔴`;
					}
				}
				if (json["officers"]) {
					for (const officer of json["officers"]) {
						let oUrl = `https://ngmc.co/p/${officer["name"]}`;
						oUrl = oUrl.replace(/ /g, "%20");
						if (officer["online"]) {
							onlineCount = onlineCount + 1;
							let locationString = "Location Hidden";
							if (officer["lastServerParsed"]) {
								locationString = officer["lastServerParsed"]["pretty"];
							}
							officerString = officerString + `🟢 [${officer["name"]}](${oUrl}) [**${locationString}**]\n`;
						} else {
							officerString = officerString + `🔴 [${officer["name"]}](${oUrl})\n`;
						}
					}
				}
				if (json["members"]) {
					for (const member of json["members"]) {
						let mUrl = `https://ngmc.co/p/${member["name"]}`;
						mUrl = mUrl.replace(/ /g, "%20");
						if (member["online"]) {
							onlineCount = onlineCount + 1;
							let locationString = "Location Hidden";
							if (member["lastServerParsed"]) {
								locationString = member["lastServerParsed"]["pretty"];
							}
							membersString = membersString + `🟢 [${member["name"]}](${mUrl}) [**${locationString}**]\n`;
						} else {
							membersString = membersString + `🔴 [${member["name"]}](${mUrl})\n`;
						}
					}
				}
				let lString = leaderString;
				let oString = officerString;
				let mString = membersString;
				if (!lString || lString == "") {
					lString = "None";
				}
				if (!oString || oString == "") {
					oString = "None";
				}
				if (!mString || mString == "") {
					mString = "None";
				}
				let embedFields = [
					{
						name: "Level",
						value: `${json["level"]} (${json["xpToNextLevel"]} xp to ${json["level"] + 1})`,
					},
					{
						name: "Xp",
						value: `${json["xp"]}`,
						inline: true,
					},
					{
						name: "Leader",
						value: `${lString}`,
						inline: true,
					},
					{
						name: "Member Count",
						value: `${json["memberCount"]} / ${json["maxSize"]}`,
						inline: true,
					},
					{
						name: "Online Count",
						value: `${onlineCount} / ${json["memberCount"]}`,
						inline: true,
					},
					{
						name: "Leaderboard position",
						value: `${position}`,
						inline: true,
					},

					{
						name: "Officers",
						value: `${oString}`,
					},
				];
				function splitFields(rolesList) {
					const maxChunkLength = 1024;
					const textList = rolesList.split(/\n+/); // Split by whitespace
					let currentChunk = "";
					const chunks = [];
					for (const text of textList) {
						if (currentChunk.length + text.length + 1 <= maxChunkLength) {
							// Add the mention to the current chunk
							currentChunk += `${text}\n`;
						} else {
							// Start a new chunk
							chunks.push(currentChunk.trim());
							currentChunk = text + "\n";
						}
					}
					// Add the last chunk
					if (currentChunk) {
						chunks.push(currentChunk.trim());
					}
					return chunks;
				}
				const membersStrings = splitFields(mString);
				for (x in membersStrings) {
					let currentField = membersStrings[x];
					if (x == 0) {
						embedFields.push({ name: "Members", value: currentField, inline: true });
					} else {
						embedFields.push({ name: "---", value: currentField, inline: true });
					}
				}
				if (json["autoKickDays"]) {
					embedFields.push({ name: "AutoKick", value: `Auto kick after ${json["autoKickDays"]} days` });
				}
				if (json["discordInvite"]) {
					embedFields.push({ name: "Discord Invite", value: `https://discord.gg/invite/${json["discordInvite"]}` });
				}
				const statsEmbed = new EmbedBuilder()
					.setColor(color)
					.setTitle(`${json["name"]}'s Guild Info`)
					.setURL(`https://ngmc.co/g/${json["name"].replace(/ /g, "%20")}`)
					.setDescription(motd)
					.addFields(embedFields)
					.setTimestamp(Date.now());
				await interaction.editReply({ embeds: [statsEmbed] });
			} else if (interaction.options.getSubcommand() == "guildleaderboard") {
				const guildName = interaction.options.getString("guild");
				const statistic = interaction.options.getString("statistic");
				const period = interaction.options.getString("period");

				let url = `https://api.ngmc.co/v1/guilds/${guildName}`;
interaction.editReply({ content: "Fetching stats... (1/2)" });
				const response = await fetch(url, {
					method: "GET",
					headers: fetchHeaders,
				});
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Guild not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				let json;
				json = await response.json();
				let color = 0xd79b4e;
				if (json["tagColor"]) {
					color = parseInt(json["tagColor"].slice(1), 16);
				}

				bulkFetchList = [];

				if (json["leader"]) {
					bulkFetchList.push(json["leader"]);
				}
				if (json["officers"]) {
					for (const officer of json["officers"]) {
						bulkFetchList.push(officer);
					}
				}
				if (json["members"]) {
					for (const member of json["members"]) {
						bulkFetchList.push(member);
					}
				}

				url = "https://api.ngmc.co/v1/players/batch";
				let data = {
					names: ["lioncat6", "notthatbrit"],
				};

				if (period) {
					data = {
						names: bulkFetchList,
						period: period,
					};
				}
interaction.editReply({ content: "Fetching stats... (2/2)" });
				const response2 = await fetch(url, {
					method: "POST",
					headers: fetchHeaders,
					body: JSON.stringify(data),
				});

				if (!response2.ok) {
					if (response.status == 404) {
						throw new Error(`Players not found!`);
					}
					throw new Error(`NetherGames API error: ${response.status}`);
				}

				const playerJson = await response2.json();

				function getStat(player, statistic) {
					if (statistic == "kills") {
						return player["kills"];
					} else if (statistic == "kdr") {
						let kdr = truncateToThreeDecimals(player["kills"] / player["deaths"]);
						if (isNaN(kdr) || kdr == null || kdr == undefined) {
							kdr = 0;
						}
						return kdr;
					} else if (statistic == "wins") {
						return player["wins"];
					} else if (statistic == "wlr") {
						let wlr = truncateToThreeDecimals(player["wins"] / player["losses"]);
						if (isNaN(wlr) || wlr == null || wlr == undefined) {
							wlr = 0;
						}
						return wlr;
					} else if (statistic == "gxp") {
						return player["extra"]["gxp"];
					}
				}

				let membersList = [];
				let totalValue = 0;
				
				for (const member of playerJson) {
					let mUrl = `https://ngmc.co/p/${member["name"]}`;
					mUrl = mUrl.replace(/ /g, "%20");
					let playerStatistic = getStat(member, statistic);
					if (playerStatistic != Infinity){
						totalValue += playerStatistic;
					}
					
					let playerString = `🔴 [${member["name"]}](${mUrl})`;
					if (member["online"]) {
						playerString = `🟢 [${member["name"]}](${mUrl})`;
					}

					// Insert player into the sorted list
					let inserted = false;
					for (let x = 0; x < membersList.length; x++) {
						if (playerStatistic > membersList[x]["value"]) {
							membersList.splice(x, 0, { value: playerStatistic, name: playerString });
							inserted = true;
							break;
						}
					}
					if (!inserted) {
						membersList.push({ value: playerStatistic, name: playerString });
					}
				}
				let numList = membersList.length
				lbString = "";
				for (x in membersList) {
					lbString = lbString + x + ". " + membersList[x]["name"] + " - `" + membersList[x]["value"] + "`\n";
				}

				function splitFields(rolesList) {
					const maxChunkLength = 1024;
					const textList = rolesList.split(/\n+/); // Split by whitespace
					let currentChunk = "";
					const chunks = [];
					for (const text of textList) {
						if (currentChunk.length + text.length + 1 <= maxChunkLength) {
							// Add the mention to the current chunk
							currentChunk += `${text}\n`;
						} else {
							// Start a new chunk
							chunks.push(currentChunk.trim());
							currentChunk = text + "\n";
						}
					}
					// Add the last chunk
					if (currentChunk) {
						chunks.push(currentChunk.trim());
					}
					return chunks;
				}
				let embedFields = [];
				const membersStrings = splitFields(lbString);
				for (x in membersStrings) {
					let currentField = membersStrings[x];
					if (x == 0) {
						embedFields.push({ name: "Leaderboard", value: currentField });
					} else {
						embedFields.push({ name: "---", value: currentField });
					}
				}
				const statDict = { kills: "Kills", kdr: "K/DR", wins: "Wins", wlr: "W/LR", gxp: "GXP" };
				const periodDict = { global: "Global (All Time)", daily: "Daily", weekly: "Weekly", biweekly: "Bi-Weekly", monthly: "Monthly", yearly: "Yearly" };

				let name = `${json["name"]}'s Guild ${statDict[statistic]} Leaderboard`;
				
				let desc = `Total Guild ${statDict[statistic]}: \`${totalValue}\``;
				if (period) {
					name = `${json["name"]}'s ${periodDict[period]} Guild ${statDict[statistic]} Leaderboard`;
					desc = `Total ${periodDict[period]} Guild ${statDict[statistic]}: \`${totalValue}\``;
				}

				if (statistic == "kdr" || statistic == "wlr"){
					desc = `Guild Leaderboard`
				}

				const statsEmbed = new EmbedBuilder().setColor(color).setTitle(name).setDescription(desc).addFields(embedFields).setTimestamp(Date.now());
				await interaction.editReply({ embeds: [statsEmbed] });
			} else if (interaction.options.getSubcommand() == "gstats") {
				const gameMode = interaction.options.getString("game");
				const period = interaction.options.getString("period");
				const playername = interaction.options.getString("ign");
				let url = `https://api.ngmc.co/v1/players/${playername}?withWinStreaks=true`;
				if (period) {
					url = `https://api.ngmc.co/v1/players/${playername}?withWinStreaks=true&period=${period.toString()}`;
				}

				const response = await fetch(url, {
					method: "GET",
					headers: fetchHeaders,
				});
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Player not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				let json;
				json = await response.json();
				let embedFields = [];
				let friendlyGameName = "";
				let footer = "";
				let thumbnail = "";
				function findGameKey(gameList, targetKey) {
					for (const game of gameList) {
						if (game.gameKey === targetKey) {
							return game;
						}
					}

					// If not found, create a default game entry
					return {
						gameKey: targetKey,
						gameKeyFriendly: "Unknown Game",
						current: 0,
						best: 0,
					};
				}
				const periodDict = { global: "Global (All Time)", daily: "Daily", weekly: "Weekly", biweekly: "Bi-Weekly", monthly: "Monthly", yearly: "Yearly" };

				if (gameMode == "bedwars") {
					thumbnail = "https://github.com/Lioncat6/lbassets/raw/main/bedwars.png";
					friendlyGameName = "Bedwars";
					const bedsBroken = json["extraNested"]["bw"]["beds"]["broken"];
					const deaths = json["extraNested"]["bw"]["deaths"];
					const diamondsCollected = json["extraNested"]["bw"]["diamonds"]["collected"];
					const emeraldsCollected = json["extraNested"]["bw"]["emeralds"]["collected"];
					const finalKills = json["extraNested"]["bw"]["final"]["kills"];
					const goldCollected = json["extraNested"]["bw"]["gold"]["collected"];
					const ironCollected = json["extraNested"]["bw"]["iron"]["collected"];
					const kills = json["extraNested"]["bw"]["kills"];
					const wins = json["extraNested"]["bw"]["wins"];

					const doublesBedsBroken = json["extraNested"]["bw"]["doubles"]["beds"]["broken"];
					const doublesDeaths = json["extraNested"]["bw"]["doubles"]["deaths"];
					const doublesFinalKills = json["extraNested"]["bw"]["doubles"]["final"]["kills"];
					const doublesKills = json["extraNested"]["bw"]["doubles"]["kills"];
					const doublesWins = json["extraNested"]["bw"]["doubles"]["wins"];

					const squadsBedsBroken = json["extraNested"]["bw"]["squads"]["beds"]["broken"];
					const squadsDeaths = json["extraNested"]["bw"]["squads"]["deaths"];
					const squadsFinalKills = json["extraNested"]["bw"]["squads"]["final"]["kills"];
					const squadsKills = json["extraNested"]["bw"]["squads"]["kills"];
					const squadsWins = json["extraNested"]["bw"]["squads"]["wins"];

					const soloBedsBroken = json["extraNested"]["bw"]["solo"]["beds"]["broken"];
					const soloDeaths = json["extraNested"]["bw"]["solo"]["deaths"];
					const soloFinalKills = json["extraNested"]["bw"]["solo"]["final"]["kills"];
					const soloKills = json["extraNested"]["bw"]["solo"]["kills"];
					const soloWins = json["extraNested"]["bw"]["solo"]["wins"];

					const bedsBroken1v1 = json["extraNested"]["bw"]["1v1"]["beds"]["broken"];
					const deaths1v1 = json["extraNested"]["bw"]["1v1"]["deaths"];
					const finalKills1v1 = json["extraNested"]["bw"]["1v1"]["final"]["kills"];
					const kills1v1 = json["extraNested"]["bw"]["1v1"]["kills"];
					const wins1v1 = json["extraNested"]["bw"]["1v1"]["wins"];

					const bedsBroken2v2 = json["extraNested"]["bw"]["2v2"]["beds"]["broken"];
					const deaths2v2 = json["extraNested"]["bw"]["2v2"]["deaths"];
					const finalKills2v2 = json["extraNested"]["bw"]["2v2"]["final"]["kills"];
					const kills2v2 = json["extraNested"]["bw"]["2v2"]["kills"];
					const wins2v2 = json["extraNested"]["bw"]["2v2"]["wins"];

					const bwDoublesStreaks = findGameKey(json["winStreaks"], "bw_doubles");
					const bwSoloStreaks = findGameKey(json["winStreaks"], "bw_solo");
					const bwSquadStreaks = findGameKey(json["winStreaks"], "bw_squads");
					const bw1v1Streaks = findGameKey(json["winStreaks"], "bw_1v1");
					const bw2v2Streaks = findGameKey(json["winStreaks"], "bw_2v2");

					embedFields.push({
						inline: true,
						name: "__Overall__:",
						value: `**Kills:** ${kills}\n**Deaths:** ${deaths}\n**Final Kills:** ${finalKills}\n**K/DR:** ${truncateToThreeDecimals(
							kills / deaths
						)}\n**Wins:** ${wins}\n**Beds Broken:** ${bedsBroken}\nIron Collected: ${ironCollected}\nGold Collected: ${goldCollected}\nDiamonds Collected: ${diamondsCollected}\nEmeralds Collected: ${emeraldsCollected}`,
					});
					embedFields.push({
						inline: true,
						name: "__Solo__:",
						value: `**Kills:** ${soloKills}\n**Deaths:** ${soloDeaths}\n**Final Kills:** ${soloFinalKills}\n**K/DR:** ${truncateToThreeDecimals(soloKills / soloDeaths)}\n**Wins:** ${soloWins}\n**Beds Broken:** ${soloBedsBroken}\n__Win Streak__: ${
							bwSoloStreaks["current"]
						} / ${bwSoloStreaks["best"]}`,
					});
					embedFields.push({
						inline: true,
						name: "__Doubles__:",
						value: `**Kills:** ${doublesKills}\n**Deaths:** ${doublesDeaths}\n**Final Kills:** ${doublesFinalKills}\n**K/DR:** ${truncateToThreeDecimals(
							doublesKills / doublesDeaths
						)}\n**Wins:** ${doublesWins}\n**Beds Broken:** ${doublesBedsBroken}\n__Win Streak__: ${bwDoublesStreaks["current"]} / ${bwDoublesStreaks["best"]}`,
					});
					embedFields.push({
						inline: true,
						name: "__Squads__:",
						value: `**Kills:** ${squadsKills}\n**Deaths:** ${squadsDeaths}\n**Final Kills:** ${squadsFinalKills}\n**K/DR:** ${truncateToThreeDecimals(
							squadsKills / squadsDeaths
						)}\n**Wins:** ${squadsWins}\n**Beds Broken:** ${squadsBedsBroken}\n__Win Streak__: ${bwSquadStreaks["current"]} / ${bwSquadStreaks["best"]}`,
					});
					embedFields.push({
						inline: true,
						name: "__1v1__:",
						value: `**Kills:** ${kills1v1}\n**Deaths:** ${deaths1v1}\n**Final Kills:** ${finalKills1v1}\n**K/DR:** ${truncateToThreeDecimals(kills1v1 / deaths1v1)}\n**Wins:** ${wins1v1}\n**Beds Broken:** ${bedsBroken1v1}\n__Win Streak__: ${
							bw1v1Streaks["current"]
						} / ${bw1v1Streaks["best"]}`,
					});
					embedFields.push({
						inline: true,
						name: "__2v2__:",
						value: `**Kills:** ${kills2v2}\n**Deaths:** ${deaths2v2}\n**Final Kills:** ${finalKills2v2}\n**K/DR:** ${truncateToThreeDecimals(kills2v2 / deaths2v2)}\n**Wins:** ${wins2v2}\n**Beds Broken:** ${bedsBroken2v2}\n__Win Streak__: ${
							bw2v2Streaks["current"]
						} / ${bw2v2Streaks["best"]}`,
					});
				} else if (gameMode == "skywars") {
					thumbnail = "https://github.com/Lioncat6/lbassets/raw/main/skywars.png";
					friendlyGameName = "Skywars";
					const blocksBroken = json["extraNested"]["sw"]["blocks"]["broken"];
					const blocksPlaced = json["extraNested"]["sw"]["blocks"]["placed"];
					const coins = json["extraNested"]["sw"]["coins"];
					const deaths = json["extraNested"]["sw"]["deaths"];
					const wins = json["extraNested"]["sw"]["wins"];
					const eggsThrown = json["extraNested"]["sw"]["eggs"]["thrown"];
					const enderPearlsThrown = json["extraNested"]["sw"]["epearls"]["thrown"];
					const kills = json["extraNested"]["sw"]["kills"];
					const losses = json["extraNested"]["sw"]["losses"];

					const soloDeaths = json["extraNested"]["sw"]["solo"]["deaths"];
					const soloInsaneDeaths = json["extraNested"]["sw"]["solo"]["insane"]["deaths"];
					const soloInsaneKills = json["extraNested"]["sw"]["solo"]["insane"]["kills"];
					const soloKills = json["extraNested"]["sw"]["solo"]["kills"];
					const soloLosses = json["extraNested"]["sw"]["solo"]["losses"];
					const soloNormalDeaths = json["extraNested"]["sw"]["solo"]["normal"]["deaths"];
					const soloNormalKills = json["extraNested"]["sw"]["solo"]["normal"]["kills"];
					const soloWins = json["extraNested"]["sw"]["solo"]["wins"];

					const doublesDeaths = json["extraNested"]["sw"]["doubles"]["deaths"];
					const doublesInsaneDeaths = json["extraNested"]["sw"]["doubles"]["insane"]["deaths"];
					const doublesInsaneKills = json["extraNested"]["sw"]["doubles"]["insane"]["kills"];
					const doublesKills = json["extraNested"]["sw"]["doubles"]["kills"];
					const doublesLosses = json["extraNested"]["sw"]["doubles"]["losses"];
					const doublesNormalDeaths = json["extraNested"]["sw"]["doubles"]["normal"]["deaths"];
					const doublesNormalKills = json["extraNested"]["sw"]["doubles"]["normal"]["kills"];
					const doublesWins = json["extraNested"]["sw"]["doubles"]["wins"];

					const swDoublesStreaks = findGameKey(json["winStreaks"], "sw_doubles");
					const swSoloStreaks = findGameKey(json["winStreaks"], "sw_solo");
					const sw1v1Streaks = findGameKey(json["winStreaks"], "sw_1v1");
					const sw2v2Streaks = findGameKey(json["winStreaks"], "sw_2v2");

					embedFields.push({
						inline: true,
						name: "__Overall__:",
						value: `**Kills:** ${kills}\n**Deaths:** ${deaths}\n**K/DR:** ${truncateToThreeDecimals(kills / deaths)}\n**Wins:** ${wins}\n**Losses:** ${losses}\n**W/LR:** ${truncateToThreeDecimals(
							wins / losses
						)}\n**Coins:** ${coins}\nBlocks Placed: ${blocksPlaced}\nBlocks Broken: ${blocksBroken}\nEnder Pearls Thrown: ${enderPearlsThrown}\nEggs Thrown: ${eggsThrown}`,
					});
					embedFields.push({
						inline: true,
						name: "__Solo__:",
						value: `*__Overall__*:\n**Kills:** ${soloKills}\n**Deaths:** ${soloDeaths}\n**K/DR:** ${truncateToThreeDecimals(soloKills / soloDeaths)}\n**Wins:** ${soloWins}\n**Losses:** ${soloLosses}\n**W/LR:** ${truncateToThreeDecimals(
							soloWins / soloLosses
						)}\n*__Normal__*:\n**Kills:** ${soloNormalKills}\n**Deaths:** ${soloNormalDeaths}\n**K/DR:** ${truncateToThreeDecimals(
							soloNormalKills / soloNormalDeaths
						)}\n*__Insane__*:\n**Kills:** ${soloInsaneKills}\n**Deaths:** ${soloInsaneDeaths}\n**K/DR:** ${truncateToThreeDecimals(soloInsaneKills / soloInsaneDeaths)}\n__Win Streak__: ${swSoloStreaks["current"]} / ${swSoloStreaks["best"]}`,
					});
					embedFields.push({
						inline: true,
						name: "__Doubles__:",
						value: `*__Overall__*:\n**Kills:** ${doublesKills}\n**Deaths:** ${doublesDeaths}\n**K/DR:** ${truncateToThreeDecimals(doublesKills / doublesDeaths)}\n**Wins:** ${doublesWins}\n**Losses:** ${doublesLosses}\n**W/LR:** ${
							doublesWins / doublesLosses
						}\n*__Normal__*:\n**Kills:** ${doublesNormalKills}\n**Deaths:** ${doublesNormalDeaths}\n**K/DR:** ${truncateToThreeDecimals(
							doublesNormalKills / doublesNormalDeaths
						)}\n*__Insane__*:\n**Kills:** ${doublesInsaneKills}\n**Deaths:** ${doublesInsaneDeaths}\n**K/DR:** ${truncateToThreeDecimals(doublesInsaneKills / doublesInsaneDeaths)}\n__Win Streak__: ${swDoublesStreaks["current"]} / ${
							swDoublesStreaks["best"]
						}`,
					});
					embedFields.push({ name: "__Other__:", value: `__1v1 Streak__: ${sw1v1Streaks["current"]} / ${sw1v1Streaks["best"]}\n__2v2 Streak__: ${sw2v2Streaks["current"]} / ${sw2v2Streaks["best"]}` });
				} else if (gameMode == "survivalGames") {
					thumbnail = "https://github.com/Lioncat6/lbassets/raw/main/survivalGames.png";
					friendlyGameName = "Survival Games";
					const kills = json["extraNested"]["sg"]["kills"];
					const deaths = json["extraNested"]["sg"]["deaths"];
					const wins = json["extraNested"]["sg"]["wins"];
					const sgStreaks = findGameKey(json["winStreaks"], "sg_solo");
					embedFields.push({ name: "Kills", value: `${kills}` });
					embedFields.push({ name: "Deaths", value: `${deaths}` });
					embedFields.push({ name: "K/DR", value: `${truncateToThreeDecimals(kills / deaths)}` });
					embedFields.push({ name: "Wins", value: `${wins}` });
					embedFields.push({ name: "Win Streak", value: `${sgStreaks["current"]} / ${sgStreaks["best"]}` });
				} else if (gameMode == "duels") {
					thumbnail = "https://github.com/Lioncat6/lbassets/raw/main/duels.png";
					friendlyGameName = "Duels";
					const kills = json["extraNested"]["duels"]["kills"];
					const deaths = json["extraNested"]["duels"]["deaths"];
					const wins = json["extraNested"]["duels"]["wins"];
					const losses = json["extraNested"]["duels"]["losses"];
					const duelsSoloStreak = findGameKey(json["winStreaks"], "duels_solo");
					const duelsDoubleStreak = findGameKey(json["winStreaks"], "duels_doubles");
					embedFields.push({ name: "Kills", value: `${kills}` });
					embedFields.push({ name: "Deaths", value: `${deaths}` });
					embedFields.push({ name: "K/DR", value: `${truncateToThreeDecimals(kills / deaths)}` });
					embedFields.push({ name: "Wins", value: `${wins}` });
					embedFields.push({ name: "Losses", value: `${losses}` });
					embedFields.push({ name: "W/LR", value: `${truncateToThreeDecimals(wins / losses)}` });
					embedFields.push({ name: "Solo Streak", value: `${duelsSoloStreak["current"]} / ${duelsSoloStreak["best"]}` });
					embedFields.push({ name: "Doubles Streak", value: `${duelsDoubleStreak["current"]} / ${duelsDoubleStreak["best"]}` });
				} else if (gameMode == "bridge") {
					thumbnail = "https://github.com/Lioncat6/lbassets/raw/main/theBridge.png";
					friendlyGameName = "The Bridge";
					const deaths = json["extraNested"]["tb"]["deaths"];
					const wins = json["extraNested"]["tb"]["wins"];
					const goals = json["extraNested"]["tb"]["goals"];
					const kills = json["extraNested"]["tb"]["kills"];
					const losses = json["extraNested"]["tb"]["losses"];

					const soloGoals = json["extraNested"]["tb"]["solo"]["goals"];
					const soloKills = json["extraNested"]["tb"]["solo"]["kills"];
					const soloWins = json["extraNested"]["tb"]["solo"]["wins"];

					const doublesGoals = json["extraNested"]["tb"]["doubles"]["goals"];
					const doublesKills = json["extraNested"]["tb"]["doubles"]["kills"];
					const doublesWins = json["extraNested"]["tb"]["doubles"]["wins"];

					const tbSoloStreak = findGameKey(json["winStreaks"], "tb_solo");
					const tbDoubleStreak = findGameKey(json["winStreaks"], "tb_doubles");

					embedFields.push({
						inline: true,
						name: "__Overall__:",
						value: `**Kills:** ${kills}\n**Deaths:** ${deaths}\n**K/DR:** ${truncateToThreeDecimals(kills / deaths)}\n**Wins:** ${wins}\n**Losses:** ${losses}\n**W/LR:** ${truncateToThreeDecimals(wins / losses)}\n**Goals:** ${goals}`,
					});
					embedFields.push({
						inline: true,
						name: "__Solo__:",
						value: `**Kills:** ${soloKills}\n**Wins:** ${soloWins}\n**Goals:** ${soloGoals}\n__Win Streak__: ${tbSoloStreak["current"]} / ${tbSoloStreak["best"]}`,
					});
					embedFields.push({
						inline: true,
						name: "__Doubles__:",
						value: `**Kills:** ${doublesKills}\n**Wins:** ${doublesWins}\n**Goals:** ${doublesGoals}\n__Win Streak__: ${tbDoubleStreak["current"]} / ${tbDoubleStreak["best"]}`,
					});
				} else if (gameMode == "murderMystery") {
					thumbnail = "https://github.com/Lioncat6/lbassets/raw/main/murderMystery.png";
					friendlyGameName = "Murder Mystery";
					const classicDeaths = json["extraNested"]["mm"]["classic"]["deaths"];
					const classicKills = json["extraNested"]["mm"]["classic"]["kills"];
					const classicWins = json["extraNested"]["mm"]["classic"]["wins"];

					const infectionDeaths = json["extraNested"]["mm"]["infection"]["deaths"];
					const infectionKills = json["extraNested"]["mm"]["infection"]["kills"];
					const infectionWins = json["extraNested"]["mm"]["infection"]["wins"];

					const deaths = json["extraNested"]["mm"]["deaths"];
					const bowKills = json["extraNested"]["mm"]["bow"]["kills"];
					const kills = json["extraNested"]["mm"]["kills"];
					const knifeKills = json["extraNested"]["mm"]["knife"]["kills"];
					const throwKnifeKills = json["extraNested"]["mm"]["throw"]["knife"]["kills"];
					const wins = json["extraNested"]["mm"]["wins"];

					const mmClassicStreak = findGameKey(json["winStreaks"], "mm_classic");
					const mmInfectionStreak = findGameKey(json["winStreaks"], "mm_infection");

					embedFields.push({
						inline: true,
						name: "__Overall__:",
						value: `**Kills:** ${kills}\n**Deaths:** ${deaths}\n**K/DR:** ${truncateToThreeDecimals(kills / deaths)}\n**Wins:** ${wins}\nBow Kills: ${bowKills}\nKnife Kills: ${knifeKills}\nKnife Throw Kills: ${throwKnifeKills}`,
					});
					embedFields.push({
						inline: true,
						name: "__Classic__:",
						value: `**Kills:** ${classicKills}\n**Deaths:** ${classicDeaths}\n**K/DR:** ${truncateToThreeDecimals(classicKills / classicDeaths)}\n**Wins:** ${classicWins}\n__Win Streak__: ${mmClassicStreak["current"]} / ${mmClassicStreak["best"]}`,
					});
					embedFields.push({
						inline: true,
						name: "__Infection__:",
						value: `**Kills:** ${infectionKills}\n**Deaths:** ${infectionDeaths}\n**K/DR:** ${truncateToThreeDecimals(infectionKills / infectionDeaths)}\n**Wins:** ${infectionWins}\n__Win Streak__: ${mmInfectionStreak["current"]} / ${
							mmInfectionStreak["best"]
						}`,
					});
				} else if (gameMode == "conquests") {
					thumbnail = "https://github.com/Lioncat6/lbassets/raw/main/conquests.png";
					friendlyGameName = "Conquests";
					const deaths = json["extraNested"]["cq"]["deaths"];
					const diamondsCollected = json["extraNested"]["cq"]["diamonds"]["collected"];
					const emeraldsCollected = json["extraNested"]["cq"]["emeralds"]["collected"];
					const flagsCaptured = json["extraNested"]["cq"]["flags"]["captured"];
					const flagsCollected = json["extraNested"]["cq"]["flags"]["collected"];
					const flagsReturned = json["extraNested"]["cq"]["flags"]["returned"];
					const goldCollected = json["extraNested"]["cq"]["gold"]["collected"];
					const ironCollected = json["extraNested"]["cq"]["iron"]["collected"];
					const kills = json["extraNested"]["cq"]["kills"];
					const wins = json["extraNested"]["cq"]["wins"];
					embedFields.push({ name: "Kills", value: `${kills}` });
					embedFields.push({ name: "Deaths", value: `${deaths}` });
					embedFields.push({ name: "K/DR", value: `${truncateToThreeDecimals(kills / deaths)}` });
					embedFields.push({ name: "Wins", value: `${wins}` });
					embedFields.push({ name: "Flags Captured", value: `${flagsCaptured}` });
					embedFields.push({ name: "Flags Collected", value: `${flagsCollected}` });
					embedFields.push({ name: "Flags Returned", value: `${flagsReturned}` });
					embedFields.push({ name: "Iron Collected", value: `${ironCollected}` });
					embedFields.push({ name: "Gold Collected", value: `${goldCollected}` });
					embedFields.push({ name: "Diamonds Collected", value: `${diamondsCollected}` });
					embedFields.push({ name: "Emeralds Collected", value: `${emeraldsCollected}` });
				} else if (gameMode == "factions") {
					thumbnail = "https://github.com/Lioncat6/lbassets/raw/main/factions.png";
					console.log(json["factionData"]);
					if (json["factionData"]) {
						footer = "For more faction data use /ng faction <faction>";
						friendlyGameName = "Factions";
						const kills = json["factionData"]["kills"];
						const killStreak = json["factionData"]["streak"];
						const bestKillStreak = json["factionData"]["bestStreak"];
						const bounty = json["factionData"]["bounty"];
						const balance = json["factionData"]["coins"];
						const registrationDate = json["factionData"]["registerDate"];

						if (json["factionData"]["faction"]) {
							const faction = json["factionData"]["faction"]["name"];
							embedFields.push({ name: "Faction", value: `${faction}` });
						} else {
							embedFields.push({ name: "Faction", value: "none" });
						}
						embedFields.push({ name: "Kills", value: `${kills}` });
						embedFields.push({ name: "Kill Streak", value: `${killStreak} / ${bestKillStreak}` });
						embedFields.push({ name: "Bounty", value: `${bounty}` });
						embedFields.push({ name: "Balance", value: `${balance}` });

						const [, fjyear, fjmonth, fjday, fjhour, fjmin, fjsec] = registrationDate.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/);
						const fjnow = Date.now() / 1000;
						const firstJoinTimestamp = new Date(fjyear, fjmonth - 1, fjday, fjhour, fjmin, fjsec).getTime() / 1000;
						const daysAgo = Math.floor((fjnow - firstJoinTimestamp) / 86400);
						if (daysAgo < 1) {
							embedFields.push({ name: "Registration Date", value: `${registrationDate} (today)` });
						} else {
							embedFields.push({ name: "Registration Date", value: `${json["firstJoin"]} (${daysAgo} days ago)` });
						}
					} else {
						throw new Error("Player has no factions data!");
					}
				} else if (gameMode == "UHC") {
					thumbnail = "https://github.com/Lioncat6/lbassets/raw/main/uhc.png";
					friendlyGameName = "UHC";
					const deaths = json["extraNested"]["uhc"]["deaths"];
					const diamondsMined = json["extraNested"]["uhc"]["diamond"]["mined"];
					const goldMined = json["extraNested"]["uhc"]["gold"]["mined"];
					const ironMined = json["extraNested"]["uhc"]["iron"]["mined"];
					const kills = json["extraNested"]["uhc"]["kills"];
					const lapisMined = json["extraNested"]["uhc"]["lapis"]["mined"];
					const wins = json["extraNested"]["uhc"]["wins"];
					embedFields.push({ name: "Kills", value: `${kills}` });
					embedFields.push({ name: "Deaths", value: `${deaths}` });
					embedFields.push({ name: "K/DR", value: `${truncateToThreeDecimals(kills / deaths)}` });
					embedFields.push({ name: "Wins", value: `${wins}` });
					embedFields.push({ name: "Iron Mined", value: `${ironMined}` });
					embedFields.push({ name: "Gold Mined", value: `${goldMined}` });
					embedFields.push({ name: "Lapis Mined", value: `${lapisMined}` });
					embedFields.push({ name: "Diamonds Mined", value: `${diamondsMined}` });
				} else if (gameMode == "soccer") {
					thumbnail = "https://github.com/Lioncat6/lbassets/raw/main/arcade.png";
					friendlyGameName = "Soccer";
					const goals = json["extraNested"]["sc"]["goals"];
					const wins = json["extraNested"]["sc"]["wins"];
					embedFields.push({ name: "Goals", value: `${goals}` });
					embedFields.push({ name: "Wins", value: `${wins}` });
				} else if (gameMode == "mommaSays") {
					thumbnail = "https://github.com/Lioncat6/lbassets/raw/main/arcade.png";
					friendlyGameName = "Momma Says";
					const fails = json["extraNested"]["ms"]["fails"];
					const successes = json["extraNested"]["ms"]["successes"];
					const wins = json["extraNested"]["ms"]["wins"];
					embedFields.push({ name: "Successes", value: `${successes}` });
					embedFields.push({ name: "Fails", value: `${fails}` });
					embedFields.push({ name: "S/FR", value: `${truncateToThreeDecimals(successes / fails)}` });
					embedFields.push({ name: "Wins", value: `${wins}` });
				}
				let embedTitle = `${json["name"]}'s ${friendlyGameName} Stats`;
				if (period) {
					embedTitle = `${json["name"]}'s ${periodDict[period.toString()]} ${friendlyGameName} Stats`;
				}
				if (footer != "") {
					const statsEmbed = new EmbedBuilder()
						.setColor(0xd79b4e)
						.setTitle(embedTitle)
						//.setDescription(json["bio"])
						.addFields(embedFields)
						.setThumbnail(thumbnail)
						.setTimestamp(Date.now())
						.setFooter({
							text: `${footer}`,
						});
					await interaction.editReply({ embeds: [statsEmbed] });
				} else {
					const statsEmbed = new EmbedBuilder()
						.setColor(0xd79b4e)
						.setTitle(embedTitle)
						//.setDescription(json["bio"])
						.addFields(embedFields)
						.setThumbnail(thumbnail)
						.setTimestamp(Date.now());
					await interaction.editReply({ embeds: [statsEmbed] });
				}
			} else if (interaction.options.getSubcommand() == "info") {
				const playername = interaction.options.getString("ign");
				const response = await fetch(`https://api.ngmc.co/v1/players/${playername}`, {
					method: "GET",
					headers: fetchHeaders,
				});
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Player not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				let json;
				json = await response.json();
				var ranks = "";
				var ranksiterator = 0;
				for (x of json["ranks"]) {
					if (ranksiterator > 0) {
						ranks = ranks + "\n";
					}
					ranks = ranks + x;
					ranksiterator = ranksiterator + 1;
				}
				if (ranks == "") {
					ranks = "none";
				}
				var voted = "no";
				if (json["voteStatus"] == 1) {
					voted = "yes";
				}
				var tier = json["tier"];
				if (!tier) {
					tier = "none";
				}
				var guild = json["guild"];
				if (!guild) {
					guild = "none";
				}
				var banned = "no";
				if (json["banned"]) {
					banned = `Banned Until: ${new Date(json["bannedUntil"] * 1000).toLocaleString().replace(/  /g, " ")} (In ${Math.floor((json["bannedUntil"] - Date.now() / 1000) / 86400)} days)`;
				}
				var muted = "no";
				if (json["muted"]) {
					muted = `Muted Until: ${new Date(json["mutedUntil"] * 1000).toLocaleString().replace(/  /g, " ")} (In ${Math.floor((json["mutedUntil"] - Date.now() / 1000) / 86400)} days)`;
				}
				var bio = json["bio"];
				if (bio == "" || !bio) {
					bio = "`No Bio Set`";
				}
				var discordTag = json["discordId"];
				if (!discordTag) {
					discordTag = "none";
				} else {
					discordTag = `<@${discordTag}>`;
				}
				var online = "no";
				if (json["online"]) {
					online = "yes";
				}
				var firstJoin = "";
				const firstJoinString = json["firstJoin"];
				const [, fjyear, fjmonth, fjday, fjhour, fjmin, fjsec] = firstJoinString.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/);
				const fjnow = Date.now() / 1000;
				const firstJoinTimestamp = new Date(fjyear, fjmonth - 1, fjday, fjhour, fjmin, fjsec).getTime() / 1000;
				const daysAgo = Math.floor((fjnow - firstJoinTimestamp) / 86400);
				if (daysAgo < 1) {
					firstJoin = `${json["firstJoin"]} (today)`;
				} else {
					firstJoin = `${json["firstJoin"]} (${daysAgo} days ago)`;
				}
				const infoEmbed = new EmbedBuilder()
					.setColor(0xd79b4e)
					.setTitle(`${json["name"]}'s Player Info`)
					.setDescription(bio)
					.addFields(
						{
							name: "Ranks",
							value: `${ranks}`,
						},
						{
							name: "Tier",
							value: `${tier}`,
						},
						{
							name: "Guild",
							value: `${guild}`,
						},
						{
							name: "Banned",
							value: `${banned}`,
						},
						{
							name: "Muted",
							value: `${muted}`,
						},
						{
							name: "Discord Tag",
							value: `${discordTag}`,
						},
						{
							name: "Online",
							value: `${online}`,
						},
						{
							name: "Last Seen",
							value: `${json["lastSeen"]} ago`,
						},
						{
							name: "Has voted today",
							value: `${voted}`,
						},
						{
							name: "Last Location",
							value: `${json["lastServer"]}`,
						},
						{
							name: "Playtime",
							value: `${format_seconds(json["extraNested"]["online"]["time"])} (${Math.floor(json["extraNested"]["online"]["time"] / 60)} hours)`,
						},
						{
							name: "First Join",
							value: firstJoin,
						}
					)
					.setThumbnail(json["avatar"])
					.setTimestamp(Date.now());
				await interaction.editReply({ embeds: [infoEmbed] });
			} else if (interaction.options.getSubcommand() == "punishmentsaaaa") {
				const playername = interaction.options.getString("ign");
				const response = await fetch(`https://api.ngmc.co/v1/players/${playername}`, {
					method: "GET",
					headers: fetchHeaders,
				});
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Player not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				let json;
				json = await response.json();
				const punishmentsEmbed = new EmbedBuilder()
					.setColor(0xd79b4e)
					.setTitle(`${json["name"]}'s Punishments`)
					//.setDescription(json["bio"])
					.addFields({
						name: "Kills",
						value: `${json["kills"]}`,
					})
					.setThumbnail(json["avatar"]);
				await interaction.editReply({ embeds: [statsEmbed] });
			} else if (interaction.options.getSubcommand() == "skin") {
				const playername = interaction.options.getString("ign");
				const render = interaction.options.getBoolean("render");
				const response = await fetch(`https://api.ngmc.co/v1/players/${playername}`, {
					method: "GET",
					headers: fetchHeaders,
				});
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Player not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				let json;
				json = await response.json();
				var skinUrl = json["skin"];
				if (render) {
					const skinResponse = await fetch(skinUrl);
					if (skinResponse.status === 200) {
						const blob = await skinResponse.arrayBuffer();
						const data = await Buffer.from(blob);
						const base64Data = await data.toString("base64");
						const fullSkinUrl = `https://vzge.me/full/832/${base64Data}`;
						async function downloadSkin(url) {
							const headers = new Headers({
								"User-Agent": "LionBot-Discord-Bot <lioncat6pmc@gmail.com>", // Your custom User-Agent string
								Accept: "application/json",
								"Content-Type": "application/json",
							});

							const skinDataResponse = await fetch(url, {
								method: "GET",
								headers: headers,
							});

							if (skinDataResponse.ok) {
								const buffer = await skinDataResponse.arrayBuffer();
								return buffer; // This is the image data in a Buffer
							} else {
								throw new Error("Skin API error:", skinDataResponse.status);
								return null;
							}
						}

						const file = new AttachmentBuilder(Buffer.from(await downloadSkin(fullSkinUrl)));
						file.name = `${json["name"]}.png`;
						const skinEmbed = new EmbedBuilder()
							.setColor(0xd79b4e)
							.setTitle(`${json["name"]}'s skin`)
							.setImage(`attachment://${json["name"].replace(/ /g, "%20")}.png`)
							.setTimestamp(Date.now());
						await interaction.editReply({ embeds: [skinEmbed], files: [file] });
					} else {
						throw new Error(`NetherGames API error: ${skinResponse.status}`);
					}
				} else {
					const skinEmbed = new EmbedBuilder().setColor(0xd79b4e).setTitle(`${json["name"]}'s skin`).setURL(skinUrl).setImage(skinUrl).setTimestamp(Date.now());
					await interaction.editReply({ embeds: [skinEmbed] });
				}
			} else {
				await interaction.editReply({ content: `Coming soon...`, ephemeral: true });
			}
		} catch (error) {
			if (String(error).includes("api error")) {
				const ngErrEmbed = new EmbedBuilder().setColor(0xff0000).setTitle(`API Error ❌`).setDescription(String(error));
				await interaction.editReply({
					content: "",
					embeds: [ngErrEmbed],
					ephemeral: true,
				});
				setTimeout(async () => {
					try {
						await interaction.deleteReply();
					} catch {}
				}, 10000);
			} else if (String(error).includes("not found")) {
				const playerNotFoundEmbed = new EmbedBuilder().setColor(0xff0000).setTitle(`${String(error)} ❌`);
				await interaction.editReply({
					content: "",
					embeds: [playerNotFoundEmbed],
					ephemeral: true,
				});
				setTimeout(async () => {
					try {
						await interaction.deleteReply();
					} catch {}
				}, 10000);
			} else if (String(error).includes("factions data")) {
				const playerNotFoundEmbed = new EmbedBuilder().setColor(0xff0000).setTitle(`Player has no factions data ❌`);
				await interaction.editReply({
					content: "",
					embeds: [playerNotFoundEmbed],
					ephemeral: true,
				});
				setTimeout(async () => {
					try {
						await interaction.deleteReply();
					} catch {}
				}, 10000);
			} else {
				console.error(error);
				throw new Error(error);
			}
		}
	},
};
