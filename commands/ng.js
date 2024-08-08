const { SlashCommandBuilder, Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require("discord.js");
var request = require("request").defaults({ encoding: null });

const playerPicture = require("../scripts/generatePlayerpicture.js");

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
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("playerpicture")
				.setDescription("Generate player picture")
				.addStringOption((option) => option.setName("ign").setDescription("Name of the player on the NetherGames server").setRequired(true))
		)
		.addSubcommand((subcommand) => subcommand.setName("online").setDescription("Fetch online player count")),
	async execute(interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			throw new Error(error);
		}
		try {
			if (interaction.options.getSubcommand() == "online") {
				const response = await fetch("https://api.ngmc.co/v1/servers/ping");
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
			}
			if (interaction.options.getSubcommand() == "playerpicture") {
        interaction.editReply({ content: "Fetching stats..." });
				const playername = interaction.options.getString("ign");
				const render = true;
				const response = await fetch(`https://api.ngmc.co/v1/players/${playername}?withWinStreaks=true&withGuildData=true`);
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Player not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				const json = await response.json();
				var skinUrl = json["skin"];

				const monthlyResponse = await fetch(`https://api.ngmc.co/v1/players/${playername}?period=monthly`);
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Player not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				const monthly = await monthlyResponse.json();
				const weeklyResponse = await fetch(`https://api.ngmc.co/v1/players/${playername}?period=weekly`);
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Player not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				const weekly = await weeklyResponse.json();

        let playerPictureBuffer 
        interaction.editReply({ content: "Downloading skin..." });
				if (skinUrl != "https://cdn.nethergames.org/skins/def463341f256af9656a2eebea910968/full.png") {
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
            interaction.editReply({ content: "Rendering Picture..." });
						playerPictureBuffer = await playerPicture.createPlayerPictureText(json, monthly, weekly, Buffer.from(await downloadSkin(fullSkinUrl)));
					} else {
						throw new Error(`NetherGames api error: ${response.status}`);
					}
				} else {
          interaction.editReply({ content: "Rendering Picture..." });
					playerPictureBuffer = await playerPicture.createPlayerPictureText(json, monthly, weekly);
				}
        const file = new AttachmentBuilder(playerPictureBuffer);
        file.name = "playerPicture.png"
        await interaction.editReply({ content: "", files: [file] });
			} else if (interaction.options.getSubcommand() == "stats") {
				const playername = interaction.options.getString("ign");
				const response = await fetch(`https://api.ngmc.co/v1/players/${playername}`);
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Player not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				const json = await response.json();
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
							value: `${json["wins"] / json["losses"]}`,
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
			} else if (interaction.options.getSubcommand() == "gstats") {
				const gameMode = interaction.options.getString("game");
				const playername = interaction.options.getString("ign");
				const response = await fetch(`https://api.ngmc.co/v1/players/${playername}?withWinStreaks=true`);
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Player not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				const json = await response.json();
				let embedFields = [];
				let friendlyGameName = "";
				let footer = "";
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
				if (gameMode == "bedwars") {
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
						name: "__Overall__:",
						value: `**Kills:** ${kills}\n**Deaths:** ${deaths}\n**Final Kills:** ${finalKills}\n**K/DR:** ${
							kills / deaths
						}\n**Wins:** ${wins}\n**Beds Broken:** ${bedsBroken}\nIron Collected: ${ironCollected}\nGold Collected: ${goldCollected}\nDiamonds Collected: ${diamondsCollected}\nEmeralds Collected: ${emeraldsCollected}`,
					});
					embedFields.push({
						name: "__Solo__:",
						value: `**Kills:** ${soloKills}\n**Deaths:** ${soloDeaths}\n**Final Kills:** ${soloFinalKills}\n**K/DR:** ${soloKills / soloDeaths}\n**Wins:** ${soloWins}\n**Beds Broken:** ${soloBedsBroken}\n__Win Streak__: ${
							bwSoloStreaks["current"]
						} / ${bwSoloStreaks["best"]}`,
					});
					embedFields.push({
						name: "__Doubles__:",
						value: `**Kills:** ${doublesKills}\n**Deaths:** ${doublesDeaths}\n**Final Kills:** ${doublesFinalKills}\n**K/DR:** ${doublesKills / doublesDeaths}\n**Wins:** ${doublesWins}\n**Beds Broken:** ${doublesBedsBroken}\n__Win Streak__: ${
							bwDoublesStreaks["current"]
						} / ${bwDoublesStreaks["best"]}`,
					});
					embedFields.push({
						name: "__Squads__:",
						value: `**Kills:** ${squadsKills}\n**Deaths:** ${squadsDeaths}\n**Final Kills:** ${squadsFinalKills}\n**K/DR:** ${squadsKills / squadsDeaths}\n**Wins:** ${squadsWins}\n**Beds Broken:** ${squadsBedsBroken}\n__Win Streak__: ${
							bwSquadStreaks["current"]
						} / ${bwSquadStreaks["best"]}`,
					});
					embedFields.push({
						name: "__1v1__:",
						value: `**Kills:** ${kills1v1}\n**Deaths:** ${deaths1v1}\n**Final Kills:** ${finalKills1v1}\n**K/DR:** ${kills1v1 / deaths1v1}\n**Wins:** ${wins1v1}\n**Beds Broken:** ${bedsBroken1v1}\n__Win Streak__: ${bw1v1Streaks["current"]} / ${
							bw1v1Streaks["best"]
						}`,
					});
					embedFields.push({
						name: "__2v2__:",
						value: `**Kills:** ${kills2v2}\n**Deaths:** ${deaths2v2}\n**Final Kills:** ${finalKills2v2}\n**K/DR:** ${kills2v2 / deaths2v2}\n**Wins:** ${wins2v2}\n**Beds Broken:** ${bedsBroken2v2}\n__Win Streak__: ${bw2v2Streaks["current"]} / ${
							bw2v2Streaks["best"]
						}`,
					});
				} else if (gameMode == "skywars") {
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
						name: "__Overall__:",
						value: `**Kills:** ${kills}\n**Deaths:** ${deaths}\n**K/DR:** ${kills / deaths}\n**Wins:** ${wins}\n**Losses:** ${losses}\n**W/LR:** ${
							wins / losses
						}\n**Coins:** ${coins}\nBlocks Placed: ${blocksPlaced}\nBlocks Broken: ${blocksBroken}\nEnder Pearls Thrown: ${enderPearlsThrown}\nEggs Thrown: ${eggsThrown}`,
					});
					embedFields.push({
						name: "__Solo__:",
						value: `*__Overall__*:\n**Kills:** ${soloKills}\n**Deaths:** ${soloDeaths}\n**K/DR:** ${soloKills / soloDeaths}\n**Wins:** ${soloWins}\n**Losses:** ${soloLosses}\n**W/LR:** ${
							soloWins / soloLosses
						}\n*__Normal__*:\n**Kills:** ${soloNormalKills}\n**Deaths:** ${soloNormalDeaths}\n**K/DR:** ${soloNormalKills / soloNormalDeaths}\n*__Insane__*:\n**Kills:** ${soloInsaneKills}\n**Deaths:** ${soloInsaneDeaths}\n**K/DR:** ${
							soloInsaneKills / soloInsaneDeaths
						}\n__Win Streak__: ${swSoloStreaks["current"]} / ${swSoloStreaks["best"]}`,
					});
					embedFields.push({
						name: "__Doubles__:",
						value: `*__Overall__*:\n**Kills:** ${doublesKills}\n**Deaths:** ${doublesDeaths}\n**K/DR:** ${doublesKills / doublesDeaths}\n**Wins:** ${doublesWins}\n**Losses:** ${doublesLosses}\n**W/LR:** ${
							doublesWins / doublesLosses
						}\n*__Normal__*:\n**Kills:** ${doublesNormalKills}\n**Deaths:** ${doublesNormalDeaths}\n**K/DR:** ${
							doublesNormalKills / doublesNormalDeaths
						}\n*__Insane__*:\n**Kills:** ${doublesInsaneKills}\n**Deaths:** ${doublesInsaneDeaths}\n**K/DR:** ${doublesInsaneKills / doublesInsaneDeaths}\n__Win Streak__: ${swDoublesStreaks["current"]} / ${swDoublesStreaks["best"]}`,
					});
					embedFields.push({ name: "__Other__:", value: `__1v1 Streak__: ${sw1v1Streaks["current"]} / ${sw1v1Streaks["best"]}\n__2v2 Streak__: ${sw2v2Streaks["current"]} / ${sw2v2Streaks["best"]}` });
				} else if (gameMode == "survivalGames") {
					friendlyGameName = "Survival Games";
					const kills = json["extraNested"]["sg"]["kills"];
					const deaths = json["extraNested"]["sg"]["deaths"];
					const wins = json["extraNested"]["sg"]["wins"];
					const sgStreaks = findGameKey(json["winStreaks"], "sg_solo");
					embedFields.push({ name: "Kills", value: `${kills}` });
					embedFields.push({ name: "Deaths", value: `${deaths}` });
					embedFields.push({ name: "K/DR", value: `${kills / deaths}` });
					embedFields.push({ name: "Wins", value: `${wins}` });
					embedFields.push({ name: "Win Streak", value: `${sgStreaks["current"]} / ${sgStreaks["best"]}` });
				} else if (gameMode == "duels") {
					friendlyGameName = "Duels";
					const kills = json["extraNested"]["duels"]["kills"];
					const deaths = json["extraNested"]["duels"]["deaths"];
					const wins = json["extraNested"]["duels"]["wins"];
					const losses = json["extraNested"]["duels"]["losses"];
					const duelsSoloStreak = findGameKey(json["winStreaks"], "duels_solo");
					const duelsDoubleStreak = findGameKey(json["winStreaks"], "duels_doubles");
					embedFields.push({ name: "Kills", value: `${kills}` });
					embedFields.push({ name: "Deaths", value: `${deaths}` });
					embedFields.push({ name: "K/DR", value: `${kills / deaths}` });
					embedFields.push({ name: "Wins", value: `${wins}` });
					embedFields.push({ name: "Losses", value: `${losses}` });
					embedFields.push({ name: "W/LR", value: `${wins / losses}` });
					embedFields.push({ name: "Solo Streak", value: `${duelsSoloStreak["current"]} / ${duelsSoloStreak["best"]}` });
					embedFields.push({ name: "Doubles Streak", value: `${duelsDoubleStreak["current"]} / ${duelsDoubleStreak["best"]}` });
				} else if (gameMode == "bridge") {
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

					embedFields.push({ name: "__Overall__:", value: `**Kills:** ${kills}\n**Deaths:** ${deaths}\n**K/DR:** ${kills / deaths}\n**Wins:** ${wins}\n**Losses:** ${losses}\n**W/LR:** ${wins / losses}\n**Goals:** ${goals}` });
					embedFields.push({ name: "__Solo__:", value: `**Kills:** ${soloKills}\n**Wins:** ${soloWins}\n**Goals:** ${soloGoals}\n__Win Streak__: ${tbSoloStreak["current"]} / ${tbSoloStreak["best"]}` });
					embedFields.push({ name: "__Doubles__:", value: `**Kills:** ${doublesKills}\n**Wins:** ${doublesWins}\n**Goals:** ${doublesGoals}\n__Win Streak__: ${tbDoubleStreak["current"]} / ${tbDoubleStreak["best"]}` });
				} else if (gameMode == "murderMystery") {
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

					embedFields.push({ name: "__Overall__:", value: `**Kills:** ${kills}\n**Deaths:** ${deaths}\n**K/DR:** ${kills / deaths}\n**Wins:** ${wins}\nBow Kills: ${bowKills}\nKnife Kills: ${knifeKills}\nKnife Throw Kills: ${throwKnifeKills}` });
					embedFields.push({
						name: "__Classic__:",
						value: `**Kills:** ${classicKills}\n**Deaths:** ${classicDeaths}\n**K/DR:** ${classicKills / classicDeaths}\n**Wins:** ${classicWins}\n__Win Streak__: ${mmClassicStreak["current"]} / ${mmClassicStreak["best"]}`,
					});
					embedFields.push({
						name: "__Infection__:",
						value: `**Kills:** ${infectionKills}\n**Deaths:** ${infectionDeaths}\n**K/DR:** ${infectionKills / infectionDeaths}\n**Wins:** ${infectionWins}\n__Win Streak__: ${mmInfectionStreak["current"]} / ${mmInfectionStreak["best"]}`,
					});
				} else if (gameMode == "conquests") {
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
					embedFields.push({ name: "K/DR", value: `${kills / deaths}` });
					embedFields.push({ name: "Wins", value: `${wins}` });
					embedFields.push({ name: "Flags Captured", value: `${flagsCaptured}` });
					embedFields.push({ name: "Flags Collected", value: `${flagsCollected}` });
					embedFields.push({ name: "Flags Returned", value: `${flagsReturned}` });
					embedFields.push({ name: "Iron Collected", value: `${ironCollected}` });
					embedFields.push({ name: "Gold Collected", value: `${goldCollected}` });
					embedFields.push({ name: "Diamonds Collected", value: `${diamondsCollected}` });
					embedFields.push({ name: "Emeralds Collected", value: `${emeraldsCollected}` });
				} else if (gameMode == "factions") {
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
					embedFields.push({ name: "K/DR", value: `${kills / deaths}` });
					embedFields.push({ name: "Wins", value: `${wins}` });
					embedFields.push({ name: "Iron Mined", value: `${ironMined}` });
					embedFields.push({ name: "Gold Mined", value: `${goldMined}` });
					embedFields.push({ name: "Lapis Mined", value: `${lapisMined}` });
					embedFields.push({ name: "Diamonds Mined", value: `${diamondsMined}` });
				} else if (gameMode == "soccer") {
					friendlyGameName = "Soccer";
					const goals = json["extraNested"]["sc"]["goals"];
					const wins = json["extraNested"]["sc"]["wins"];
					embedFields.push({ name: "Goals", value: `${goals}` });
					embedFields.push({ name: "Wins", value: `${wins}` });
				} else if (gameMode == "mommaSays") {
					friendlyGameName = "Momma Says";
					const fails = json["extraNested"]["ms"]["fails"];
					const successes = json["extraNested"]["ms"]["successes"];
					const wins = json["extraNested"]["ms"]["wins"];
					embedFields.push({ name: "Successes", value: `${successes}` });
					embedFields.push({ name: "Fails", value: `${fails}` });
					embedFields.push({ name: "S/FR", value: `${successes / fails}` });
					embedFields.push({ name: "Wins", value: `${wins}` });
				}
				if (footer != "") {
					const statsEmbed = new EmbedBuilder()
						.setColor(0xd79b4e)
						.setTitle(`${json["name"]}'s ${friendlyGameName} Stats`)
						//.setDescription(json["bio"])
						.addFields(embedFields)
						.setThumbnail(json["avatar"])
						.setTimestamp(Date.now())
						.setFooter({
							text: `${footer}`,
						});
					await interaction.editReply({ embeds: [statsEmbed] });
				} else {
					const statsEmbed = new EmbedBuilder()
						.setColor(0xd79b4e)
						.setTitle(`${json["name"]}'s ${friendlyGameName} Stats`)
						//.setDescription(json["bio"])
						.addFields(embedFields)
						.setThumbnail(json["avatar"])
						.setTimestamp(Date.now());
					await interaction.editReply({ embeds: [statsEmbed] });
				}
			} else if (interaction.options.getSubcommand() == "info") {
				const playername = interaction.options.getString("ign");
				const response = await fetch(`https://api.ngmc.co/v1/players/${playername}`);
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Player not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				const json = await response.json();
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
				const response = await fetch(`https://api.ngmc.co/v1/players/${playername}`);
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Player not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				const json = await response.json();
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
				const response = await fetch(`https://api.ngmc.co/v1/players/${playername}`);
				if (!response.ok) {
					if (response.status == 404) {
						throw new Error(`Player not found!`);
					}
					throw new Error(`NetherGames api error: ${response.status}`);
				}
				const json = await response.json();
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
            file.name = `${json["name"]}.png`
						const skinEmbed = new EmbedBuilder().setColor(0xd79b4e).setTitle(`${json["name"]}'s skin`).setImage(`attachment://${json["name"]}.png`).setTimestamp(Date.now());
						await interaction.editReply({ embeds: [skinEmbed], files: [file] });
					} else {
						throw new Error(`NetherGames API error: ${skinResponse.status}`);
					}
				} else {
					const skinEmbed = new EmbedBuilder().setColor(0xd79b4e).setTitle(`${json["name"]}'s skin`).setURL(skinUrl).setImage(skinUrl).setTimestamp(Date.now());
					await interaction.editReply({ embeds: [skinEmbed] });
				}
			} else {
				await interaction.editReply({ content: "Coming soon...", ephemeral: true });
			}
		} catch (error) {
			if (String(error).includes("api error")) {
				const ngErrEmbed = new EmbedBuilder().setColor(0xff0000).setTitle(`API Error ❌`).setDescription(String(error));
				await interaction.editReply({
					content: "",
					embeds: [ngErrEmbed],
					ephemeral: true,
				});
			} else if (String(error).includes("Player not found!")) {
				const playerNotFoundEmbed = new EmbedBuilder().setColor(0xff0000).setTitle(`Player Not Found ❌`);
				await interaction.editReply({
					content: "",
					embeds: [playerNotFoundEmbed],
					ephemeral: true,
				});
			} else if (String(error).includes("factions data")) {
				const playerNotFoundEmbed = new EmbedBuilder().setColor(0xff0000).setTitle(`Player has no factions data ❌`);
				await interaction.editReply({
					content: "",
					embeds: [playerNotFoundEmbed],
					ephemeral: true,
				});
			} else {
				throw new Error(error);
			}
		}
	},
};
