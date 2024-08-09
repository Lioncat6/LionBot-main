const Jimp = require("jimp");
const fs = require("node:fs");
const path = require("node:path");

var mjRegular = "./assets/fonts/mojang regular.fnt";
var mjBold = "./assets/fonts/mojang bold.fnt";

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}



async function drawMulticoloredText(baseImage, x, y, scale, textList, centerX, rightAlign) {
	var rawTextX = x;
	var rawTextY = y;
	//textList pattern = { text, color, shadow, shadowColor, shadowSize, bold }
	let textHeight = 0;
	let widthList = [];
	for (x of textList) {
		var drawFont = mjRegular;
		if (x[5]) {
			drawFont = mjBold;
		}
		var textFont = await Jimp.loadFont(drawFont);
		const measureTextWidth = Jimp.measureText(textFont, x[0]);
		const measureTextHeight = Jimp.measureTextHeight(textFont, x[0], measureTextWidth);
		if (measureTextHeight > textHeight) {
			textHeight = measureTextHeight;
		}
		widthList.push(measureTextWidth);
	}
	if (centerX) {
		var totalWidth = 0;
		for (x of widthList) {
			totalWidth = totalWidth + x;
		}
		rawTextX = rawTextX - (totalWidth / 2) * scale;
	}
	if (rightAlign) {
		var totalWidth = 0;
		for (x of widthList) {
			totalWidth = totalWidth + x;
		}
		rawTextX = rawTextX - totalWidth * scale;
	}
	//console.log(x + totalWidth + 10, y + textHeight + 10)
	var addOffset = 0;
	for (x in textList) {
		var drawFont = mjRegular;
		const current = textList[x];
		const cText = current[0];
		const cColor = current[1];
		var cShadow = current[2];
		const cShadowColor = current[3];
		const cShadowSize = current[4];
		const cBold = current[5];

		let textImage = new Jimp(totalWidth + 10 + cShadowSize, textHeight + cShadowSize, 0x0, (err, textImage) => {
			//((0x0 = 0 = rgba(0, 0, 0, 0)) = transparent)
			if (err) throw err;
		});
		if (cShadow) {
			shadowImage = new Jimp(totalWidth + 10 + cShadowSize, textHeight + cShadowSize, 0x0, (err, textImage) => {
				//((0x0 = 0 = rgba(0, 0, 0, 0)) = transparent)
				if (err) throw err;
			});
		}
		if (cBold) {
			drawFont = mjBold;
		}
		var textFont = await Jimp.loadFont(drawFont);
		if (x > 0) {
			const offset = addOffset + widthList[0];
			addOffset = offset;
			widthList.shift();
			textImage.print(textFont, 0 + offset, 0, cText);
			textImage.color([{ apply: "xor", params: [cColor] }]);
			if (cShadow) {
				shadowImage.print(textFont, 0 + offset + cShadowSize, 0 + cShadowSize, cText);
				shadowImage.color([{ apply: "xor", params: [cShadowColor] }]);
			}
		} else {
			addOffset = 0;
			textImage.print(textFont, 0, 0, cText);
			textImage.color([{ apply: "xor", params: [cColor] }]);
			if (cShadow) {
				shadowImage.print(textFont, cShadowSize, cShadowSize, cText);
				shadowImage.color([{ apply: "xor", params: [cShadowColor] }]);
			}
		}
		if (cShadow) {
			shadowImage.blit(textImage, 0, 0);
		}
		if (scale != 1.0) {
			if (cShadow) {
				await shadowImage.scale(scale, Jimp.RESIZE_NEAREST_NEIGHBOR);
			} else {
				await textImage.scale(scale, Jimp.RESIZE_NEAREST_NEIGHBOR);
			}
		}
		if (cShadow) {
			baseImage.blit(shadowImage, rawTextX, rawTextY);
		} else {
			baseImage.blit(textImage, rawTextX, rawTextY);
		}
	}
	return baseImage;
}

async function drawText(baseImage, text, x, y, scale, color, shadow, shadowColor, shadowSize, bold, centerX, rightAlign) {
	const imgWidth = baseImage.bitmap.width;
	const imgHeight = baseImage.bitmap.height;
	var drawFont = mjRegular;
	if (bold) {
		drawFont = mjBold;
	}
	var textFont = await Jimp.loadFont(drawFont);
	var textWidth, textHeight;
	const measureTextWidth = Jimp.measureText(textFont, text);
	const measureTextHeight = Jimp.measureTextHeight(textFont, text, measureTextWidth);
	textWidth = measureTextWidth;
	textHeight = measureTextHeight;
	if (centerX) {
		x = x - (textWidth / 2) * scale;
	}
	if (rightAlign) {
		x = x - textWidth * scale;
	}
	/*
  if (scale != 1.0) {
    x = x / scale;
    y = y / scale;
  }*/
	//console.log(x + textWidth + 10, y + textHeight + 10)
	let textImage = new Jimp(textWidth + 20, textHeight + 20, 0x0, (err, textImage) => {
		//((0x0 = 0 = rgba(0, 0, 0, 0)) = transparent)
		if (err) throw err;
	});
	var shadowImage;
	if (shadow) {
		shadowImage = new Jimp(textWidth + shadowSize + 20, textHeight + shadowSize + 20, 0x0, (err, textImage) => {
			//((0x0 = 0 = rgba(0, 0, 0, 0)) = transparent)
			if (err) throw err;
		});
	}

	textImage.print(textFont, 0, 0, text);
	textImage.color([{ apply: "xor", params: [color] }]);

	if (shadow) {
		shadowImage.print(textFont, 0 + shadowSize, 0 + shadowSize, text);
		shadowImage.color([{ apply: "xor", params: [shadowColor] }]);
		shadowImage.blit(textImage, 0, 0);
	}
	if (scale != 1.0) {
		if (shadow) {
			shadowImage.scale(scale, Jimp.RESIZE_NEAREST_NEIGHBOR);
		} else {
			textImage.scale(scale, Jimp.RESIZE_NEAREST_NEIGHBOR);
		}
	}
	if (shadow) {
		baseImage.blit(shadowImage, x, y);
	} else {
		baseImage.blit(textImage, x, y);
	}
	return baseImage;
}

//baseImage, x, y, scale, textList, centerX
//textList pattern = { text, color, shadow, shadowColor, shadowSize, bold

function scaleBrightness(hexColor, scale) {
	// Remove the hash symbol if it exists
	hexColor = hexColor.replace(/^#/, "");

	// Convert hex to RGB
	const bigint = parseInt(hexColor, 16);
	const red = (bigint >> 16) & 255;
	const green = (bigint >> 8) & 255;
	const blue = bigint & 255;

	// Convert RGB to HSL
	const rNorm = red / 255;
	const gNorm = green / 255;
	const bNorm = blue / 255;
	const max = Math.max(rNorm, gNorm, bNorm);
	const min = Math.min(rNorm, gNorm, bNorm);
	const lightness = (max + min) / 2;

	// Adjust lightness
	const adjustedLightness = lightness * scale;

	// Convert back to RGB
	const adjustedRed = Math.round(255 * (rNorm / lightness) * adjustedLightness);
	const adjustedGreen = Math.round(255 * (gNorm / lightness) * adjustedLightness);
	const adjustedBlue = Math.round(255 * (bNorm / lightness) * adjustedLightness);

	// Convert back to hex
	const adjustedHex = `#${((adjustedRed << 16) | (adjustedGreen << 8) | adjustedBlue).toString(16).padStart(6, "0")}`;

	return adjustedHex;
}

async function createPlayerPictureText(allTime, monthly, weekly, skinData, transparent, unbaked) {
	//variable prep
	var guild = allTime["guild"];
	if (!guild) {
		guild = "";
	}
	const playerName = allTime["name"];
	const level = allTime["level"];
	const levelColors = allTime["levelColors"];
	const xp = allTime["xp"];
	const kills = allTime["kills"];
	const deaths = allTime["deaths"];
	const wins = allTime["wins"];
	const losses = allTime["losses"];
	const credits = allTime["credits"];
	const crateKeys = allTime["crateKeys"];
	const ranks = allTime["ranks"];
	const rankColors = allTime["rankColors"];
	const voted = allTime["voteStatus"];
	const tier = allTime["tier"];
	const tierColor = allTime["tierColor"];

	const allKills = allTime["killsTotal"];
	const allDeaths = allTime["deathsTotal"];

	const monthlyXp = monthly["xp"];
	const monthlyKills = monthly["kills"];
	const monthlyDeaths = monthly["deaths"];
	const monthlyWins = monthly["wins"];
	const monthlyLosses = monthly["losses"];
	const monthlyCredits = monthly["credits"];

	const weeklyXp = weekly["xp"];
	const weeklyKills = weekly["kills"];
	const weeklyDeaths = weekly["deaths"];
	const weeklyWins = weekly["wins"];
	const weeklyLosses = weekly["losses"];
	const weeklyCredits = weekly["credits"];

	function findGameKey(gameList, targetKey) {
		for (const game of gameList) {
			if (game.gameKey === targetKey) {
				return game;
			}
		}
		return {
			gameKey: targetKey,
			gameKeyFriendly: "Unknown Game",
			current: 0,
			best: 0,
		};
	}

	//streaks
	const bwDoublesStreaks = findGameKey(allTime["winStreaks"], "bw_doubles");
	const bwSoloStreaks = findGameKey(allTime["winStreaks"], "bw_solo");
	const bwSquadStreaks = findGameKey(allTime["winStreaks"], "bw_squads");
	const bw1v1Streaks = findGameKey(allTime["winStreaks"], "bw_1v1");
	const bw2v2Streaks = findGameKey(allTime["winStreaks"], "bw_2v2");
	const swDoublesStreaks = findGameKey(allTime["winStreaks"], "sw_doubles");
	const swSoloStreaks = findGameKey(allTime["winStreaks"], "sw_solo");
	const sw1v1Streaks = findGameKey(allTime["winStreaks"], "sw_1v1");
	const sw2v2Streaks = findGameKey(allTime["winStreaks"], "sw_2v2");
	const sgStreaks = findGameKey(allTime["winStreaks"], "sg_solo");
	const duelsSoloStreak = findGameKey(allTime["winStreaks"], "duels_solo");
	const duelsDoubleStreak = findGameKey(allTime["winStreaks"], "duels_doubles");
	const tbSoloStreak = findGameKey(allTime["winStreaks"], "tb_solo");
	const tbDoubleStreak = findGameKey(allTime["winStreaks"], "tb_doubles");
	const mmClassicStreak = findGameKey(allTime["winStreaks"], "mm_classic");
	const mmInfectionStreak = findGameKey(allTime["winStreaks"], "mm_infection");

	let lastSeenLocation = "location hidden";
	try {
		lastSeenLocation = allTime["lastServerParsed"]["pretty"];
	} catch (error) {
		console.log(error);
	}
	function capitalizeFirstLetter(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
	const lastSeen = capitalizeFirstLetter(allTime["lastSeen"])+ " ago";
	const online = allTime["online"];

	function format_seconds(minutes) {
		const weeks = Math.floor(minutes / 10080); // 1 week = 7 days * 24 hours * 60 minutes
		const days = Math.floor((minutes % 10080) / 1440); // 1 day = 24 hours * 60 minutes
		const hours = Math.floor((minutes % 1440) / 60);
		const remainingMinutes = minutes % 60;
		return `${weeks}W ${days}D ${hours}H ${remainingMinutes}M`;
	}
	function truncateToThreeDecimals(number) {
		return Math.trunc(number * 1000) / 1000;
	}

	const playTime = `${format_seconds(allTime["extraNested"]["online"]["time"])} (${Math.floor(allTime["extraNested"]["online"]["time"] / 60)} hours)`;
	var firstJoin = "";
	const firstJoinString = allTime["firstJoin"];
	const [, fjyear, fjmonth, fjday, fjhour, fjmin, fjsec] = firstJoinString.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/);
	const fjnow = Date.now() / 1000;
	const firstJoinTimestamp = new Date(fjyear, fjmonth - 1, fjday, fjhour, fjmin, fjsec).getTime() / 1000;
	const daysAgo = Math.floor((fjnow - firstJoinTimestamp) / 86400);
	if (daysAgo < 1) {
		firstJoin = `${allTime["firstJoin"]} (today)`;
	} else {
		firstJoin = `${allTime["firstJoin"]} (${daysAgo} days ago)`;
	}
	//image start
	const bgNumber = getRandomNumber(1, 6);
	var fileName
	if (!transparent){
		fileName= `./assets/${bgNumber}.png`;
	} else {
		fileName = `./assets/transparentBG.png`
	}

	var t1 = Date.now();
	let bgImage = await Jimp.read(fileName);
	if (!transparent){
		let overlay = await Jimp.read("./assets/overlay.png");
		bgImage.blit(overlay, 0, 0);
	}
	const imgWidth = bgImage.bitmap.width;
	const imgHeight = bgImage.bitmap.height;
	
	if (!unbaked){
		let bakedText = await Jimp.read("./assets/baked.png");
		bgImage.blit(bakedText, 0, 0);
	}

	if (unbaked){bgImage = await drawText(bgImage, `Generated  using  LionBot`, 5, 5, .5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);}
	bgImage = await drawText(bgImage, `${(new Date(Date.now()).toLocaleString())}`, imgWidth-5, 5, .5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false, true);
	if (unbaked){bgImage = await drawText(bgImage, `Code by @Lioncat6`, 5, imgHeight-20, .5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);}
	bgImage = await drawText(bgImage, `${playerName}`, imgWidth / 2, 50, 2, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, true, true);
	bgImage = await drawText(bgImage, `${guild}`, imgWidth / 2, 20, 0.9, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, true, true);
	if (levelColors.length > 1) {
		const digits = Array.from(String(level), Number);
		let digitsList = [];
		for (num in digits) {
			digitsList.push([String(digits[num]), levelColors[num], true, scaleBrightness(levelColors[num], 0.2), 4, true]);
		}
		bgImage = await drawMulticoloredText(bgImage, imgWidth / 2, imgHeight - 65, 1.7, digitsList, true);
	} else {
		bgImage = await drawText(bgImage, `${level}`, imgWidth / 2, imgHeight - 65, 1.7, `${levelColors[0]}`, true, scaleBrightness("${levelColors[0]}", 0.2), 4, true, true);
	}
	let ranksFormatted = [];
	if (ranks.length > 1) {
		for (let num in ranks) {
			if (num == 0) {
				ranksFormatted.push([String(ranks[num]), rankColors[num], true, scaleBrightness(rankColors[num], 0.2), 4, true]);
			} else {
				ranksFormatted.push([" • ", "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, true]);
				ranksFormatted.push([String(ranks[num]), rankColors[num], true, scaleBrightness(rankColors[num], 0.2), 4, true]);
			}
		}
		bgImage = await drawMulticoloredText(bgImage, imgWidth / 2, 120, 0.6, ranksFormatted, true);
	} else if (ranks.length == 1) {
		bgImage = await drawText(bgImage, String(ranks[0]), imgWidth / 2, 120, 0.6, rankColors[0], true, scaleBrightness(rankColors[0], 0.2), 4, true, true);
	}

	let onlineStatus = ["offline", "#AA0000", true, scaleBrightness("#AA0000", 0.2), 2, false];
	if (online) {
		onlineStatus = ["Online", "#00AA00", true, scaleBrightness("#00AA00", 0.2), 2, false];
	}

	if (unbaked){bgImage = await drawText(bgImage, "First Joined", imgWidth / 2 + 350, 160, 0.65, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, true, true);}
	bgImage = await drawText(bgImage, `${firstJoin}`, imgWidth / 2 + 350, 185, 0.55, "#00AAAA", true, scaleBrightness("#00AAAA", 0.2), 3, false, true);
	if (unbaked){bgImage = await drawText(bgImage, "Play Time", imgWidth / 2 + 350, 208, 0.65, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, true, true);}
	bgImage = await drawText(bgImage, `${playTime}`, imgWidth / 2 + 350, 233, 0.55, "#FF55FF", true, scaleBrightness("#FF55FF", 0.2), 3, false, true);
	if (unbaked){bgImage = await drawText(bgImage, "Last Seen", imgWidth / 2 - 350, 160, 0.65, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, true, true);}
	bgImage = await drawMulticoloredText(bgImage, imgWidth / 2 - 350, 185, 0.55, [[`${lastSeen} (`, "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 2, false], onlineStatus, [")", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 2, false], [`[${lastSeenLocation}]`, "#AAAAAA", true, scaleBrightness("#FFFFFF", 0.2), 2, false]], true);

	//statistics
	const statsBase = 300;
	if (unbaked){bgImage = await drawText(bgImage, "Statistics", imgWidth / 2 + 350, 270, 0.65, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, true, true);}
	const leftRowCenter = imgWidth / 2 + 250;
	if (unbaked){
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRowCenter,
		statsBase,
		0.5,
		[
			["XP", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRowCenter,
		statsBase + 20,
		0.5,
		[
			["Kills", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRowCenter,
		statsBase + 40,
		0.5,
		[
			["Deaths", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRowCenter,
		statsBase + 60,
		0.5,
		[
			["Wins", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRowCenter,
		statsBase + 80,
		0.5,
		[
			["Losses", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRowCenter,
		statsBase + 100,
		0.5,
		[
			["Credits", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRowCenter,
		statsBase + 120,
		0.5,
		[
			["Vote  Status", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
}
	bgImage = await drawText(bgImage, `${xp}`, leftRowCenter + 5, statsBase, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${kills}`, leftRowCenter + 5, statsBase + 20, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${deaths}`, leftRowCenter + 5, statsBase + 40, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${wins}`, leftRowCenter + 5, statsBase + 60, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${losses}`, leftRowCenter + 5, statsBase + 80, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${credits}`, leftRowCenter + 5, statsBase + 100, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	if (voted) {
		bgImage = await drawText(bgImage, `Voted`, leftRowCenter + 5, statsBase + 120, 0.5, "#00AA00", true, scaleBrightness("#00AA00", 0.2), 4, false, false);
	} else {
		bgImage = await drawText(bgImage, `Not Voted`, leftRowCenter + 5, statsBase + 120, 0.5, "#AA0000", true, scaleBrightness("#AA0000", 0.2), 4, false, false);
	}

	const rightRowCenter = imgWidth / 2 + 450;
	if (unbaked){
	bgImage = await drawMulticoloredText(
		bgImage,
		rightRowCenter,
		statsBase,
		0.5,
		[
			["Keys", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		rightRowCenter,
		statsBase + 20,
		0.5,
		[
			["All Kills", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		rightRowCenter,
		statsBase + 40,
		0.5,
		[
			["All Deaths", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		rightRowCenter,
		statsBase + 60,
		0.5,
		[
			["K/DR", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		rightRowCenter,
		statsBase + 80,
		0.5,
		[
			["AK/ADR", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		rightRowCenter,
		statsBase + 100,
		0.5,
		[
			["W/LR", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		rightRowCenter,
		statsBase + 120,
		0.5,
		[
			["W/DR", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	}
	let kdrColor = "#ffffff"
	let kdr = allKills / allDeaths
	if (kdr <= 0.5){
		kdrColor = "#555555"
	} else if (kdr <= 1){
		kdrColor = "#AAAAAA"
	} else if (kdr <= 1.5){
		kdrColor = "#ffffff"
	} else if (kdr <= 2.5){
		kdrColor = "#FFFF55"
	} else if (kdr <= 3.2){
		kdrColor = "#FFAA00"
	} else if (kdr <= 4.5){
		kdrColor = "#FF5555"
	} else if (kdr <= 6){
		kdrColor = "#AA0000"
	} else if (kdr <= 10){
		kdrColor = "#AA00AA"
	} else{
		kdrColor = "#5555FF"
	}
	bgImage = await drawText(bgImage, `${crateKeys}`, rightRowCenter + 5, statsBase, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${allKills}`, rightRowCenter + 5, statsBase + 20, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${allDeaths}`, rightRowCenter + 5, statsBase + 40, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${truncateToThreeDecimals(kills / deaths)}`, rightRowCenter + 5, statsBase + 60, 0.5, kdrColor, true, scaleBrightness(kdrColor, 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${truncateToThreeDecimals(allKills / allDeaths)}`, rightRowCenter + 5, statsBase + 80, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${truncateToThreeDecimals(wins / losses)}`, rightRowCenter + 5, statsBase + 100, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${truncateToThreeDecimals(wins / deaths)}`, rightRowCenter + 5, statsBase + 120, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);

	//Gstats
	bgImage = await drawText(bgImage, "Most Played", imgWidth / 2 + 350, 446, 0.4, "#5555FF", true, scaleBrightness("#5555FF", 0.2), 4, true, true);
	bgImage = await drawText(bgImage, "Coming Soon...", imgWidth / 2 + 350, 462, 0.65, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, true, true);

	/*
  bgImage = await drawText(bgImage, "Bedwars", imgWidth / 2 + 350, 462, .65, "#ffffff", true, scaleBrightness("#ffffff", .2), 4, true, true);
  bgImage = await drawMulticoloredText( bgImage, leftRowCenter, 492, .5, [ ["Kills", "#55FFFF", true, scaleBrightness("#55FFFF", .2), 4, false], [":", "#FFFFFF", true, scaleBrightness("#FFFFFF", .2), 4, false] ], false, true);
  bgImage = await drawMulticoloredText( bgImage, leftRowCenter, 512, .5, [ ["Deaths", "#55FFFF", true, scaleBrightness("#55FFFF", .2), 4, false], [":", "#FFFFFF", true, scaleBrightness("#FFFFFF", .2), 4, false] ], false, true);
  bgImage = await drawMulticoloredText( bgImage, leftRowCenter, 532, .5, [ ["Wins", "#55FFFF", true, scaleBrightness("#55FFFF", .2), 4, false], [":", "#FFFFFF", true, scaleBrightness("#FFFFFF", .2), 4, false] ], false, true);
  bgImage = await drawMulticoloredText( bgImage, leftRowCenter, 552, .5, [ ["Beds Broken", "#55FFFF", true, scaleBrightness("#55FFFF", .2), 4, false], [":", "#FFFFFF", true, scaleBrightness("#FFFFFF", .2), 4, false] ], false, true);
  bgImage = await drawMulticoloredText( bgImage, leftRowCenter, 572, .5, [ ["Final Kills", "#55FFFF", true, scaleBrightness("#55FFFF", .2), 4, false], [":", "#FFFFFF", true, scaleBrightness("#FFFFFF", .2), 4, false] ], false, true);

  bgImage = await drawMulticoloredText( bgImage, rightRowCenter, 492, .5, [ ["Iron", "#55FFFF", true, scaleBrightness("#55FFFF", .2), 4, false], [":", "#FFFFFF", true, scaleBrightness("#FFFFFF", .2), 4, false] ], false, true);
  bgImage = await drawMulticoloredText( bgImage, rightRowCenter, 512, .5, [ ["Gold", "#55FFFF", true, scaleBrightness("#55FFFF", .2), 4, false], [":", "#FFFFFF", true, scaleBrightness("#FFFFFF", .2), 4, false] ], false, true);
  bgImage = await drawMulticoloredText( bgImage, rightRowCenter, 532, .5, [ ["Diamonds", "#55FFFF", true, scaleBrightness("#55FFFF", .2), 4, false], [":", "#FFFFFF", true, scaleBrightness("#FFFFFF", .2), 4, false] ], false, true);
  bgImage = await drawMulticoloredText( bgImage, rightRowCenter, 552, .5, [ ["Emeralds", "#55FFFF", true, scaleBrightness("#55FFFF", .2), 4, false], [":", "#FFFFFF", true, scaleBrightness("#FFFFFF", .2), 4, false] ], false, true);
  bgImage = await drawMulticoloredText( bgImage, rightRowCenter, 572, .5, [ ["K/DR", "#55FFFF", true, scaleBrightness("#55FFFF", .2), 4, false], [":", "#FFFFFF", true, scaleBrightness("#FFFFFF", .2), 4, false] ], false, true);
  */

	//Win Streaks
	const winSteaksBase = 255;
	if (unbaked){bgImage = await drawText(bgImage, "Win Streaks", imgWidth / 2 - 350, 225, 0.65, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, true, true);}
	const leftLeftRowCenter = imgWidth / 2 - 450;
	if (unbaked){
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter - 10,
		winSteaksBase,
		0.5,
		[
			["BW Solo", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter - 10,
		winSteaksBase + 20,
		0.5,
		[
			["BW Doubles", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter - 10,
		winSteaksBase + 40,
		0.5,
		[
			["BW Squads", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter - 10,
		winSteaksBase + 60,
		0.5,
		[
			["BW 1v1", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter - 10,
		winSteaksBase + 80,
		0.5,
		[
			["BW 2v2", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter - 10,
		winSteaksBase + 100,
		0.5,
		[
			["SW Solo", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter - 10,
		winSteaksBase + 120,
		0.5,
		[
			["SW Doubles", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter - 10,
		winSteaksBase + 140,
		0.5,
		[
			["SW 1v1", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	}
	bgImage = await drawText(bgImage, `${bwSoloStreaks["current"]} / ${bwSoloStreaks["best"]}`, leftLeftRowCenter - 10 + 5, winSteaksBase, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${bwDoublesStreaks["current"]} / ${bwDoublesStreaks["best"]}`, leftLeftRowCenter - 10 + 5, winSteaksBase + 20, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${bwSquadStreaks["current"]} / ${bwSquadStreaks["best"]}`, leftLeftRowCenter - 10 + 5, winSteaksBase + 40, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${bw1v1Streaks["current"]} / ${bw1v1Streaks["best"]}`, leftLeftRowCenter - 10 + 5, winSteaksBase + 60, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${bw2v2Streaks["current"]} / ${bw2v2Streaks["best"]}`, leftLeftRowCenter - 10 + 5, winSteaksBase + 80, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${swSoloStreaks["current"]} / ${swSoloStreaks["best"]}`, leftLeftRowCenter - 10 + 5, winSteaksBase + 100, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${swDoublesStreaks["current"]} / ${swDoublesStreaks["best"]}`, leftLeftRowCenter - 10 + 5, winSteaksBase + 120, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${sw1v1Streaks["current"]} / ${sw1v1Streaks["best"]}`, leftLeftRowCenter - 10 + 5, winSteaksBase + 140, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);

	const leftRightRowCenter = imgWidth / 2 - 250;
	if (unbaked){
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter + 10,
		winSteaksBase,
		0.5,
		[
			["TB Solo", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter + 10,
		winSteaksBase + 20,
		0.5,
		[
			["TB Doubles", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter + 10,
		winSteaksBase + 40,
		0.5,
		[
			["SG Solo", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter + 10,
		winSteaksBase + 60,
		0.5,
		[
			["Duels Solo", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter + 10,
		winSteaksBase + 80,
		0.5,
		[
			["Duels Double", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter + 10,
		winSteaksBase + 100,
		0.5,
		[
			["MM Classic", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter + 10,
		winSteaksBase + 120,
		0.5,
		[
			["MM Infection", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter + 10,
		winSteaksBase + 140,
		0.5,
		[
			["SW 2v2", "#FFAA00", true, scaleBrightness("#FFAA00", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	}
	bgImage = await drawText(bgImage, `${tbSoloStreak["current"]} / ${tbSoloStreak["best"]}`, leftRightRowCenter + 10 + 5, winSteaksBase, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${tbDoubleStreak["current"]} / ${tbDoubleStreak["best"]}`, leftRightRowCenter + 10 + 5, winSteaksBase + 20, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${sgStreaks["current"]} / ${sgStreaks["best"]}`, leftRightRowCenter + 10 + 5, winSteaksBase + 40, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${duelsSoloStreak["current"]} / ${duelsSoloStreak["best"]}`, leftRightRowCenter + 10 + 5, winSteaksBase + 60, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${duelsDoubleStreak["current"]} / ${duelsDoubleStreak["best"]}`, leftRightRowCenter + 10 + 5, winSteaksBase + 80, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${mmClassicStreak["current"]} / ${mmClassicStreak["best"]}`, leftRightRowCenter + 10 + 5, winSteaksBase + 100, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${mmInfectionStreak["current"]} / ${mmInfectionStreak["best"]}`, leftRightRowCenter + 10 + 5, winSteaksBase + 120, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${sw2v2Streaks["current"]} / ${sw2v2Streaks["best"]}`, leftRightRowCenter + 10 + 5, winSteaksBase + 140, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);

	//monthly / weekly
	const wmBase = 455;
	if (unbaked){
	bgImage = await drawText(bgImage, "Monthly        •        Weekly", imgWidth / 2 - 350, wmBase - 30, 0.65, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, true, true);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter,
		wmBase,
		0.5,
		[
			["Wins", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter,
		wmBase + 20,
		0.5,
		[
			["Losses", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter,
		wmBase + 40,
		0.5,
		[
			["W/LR", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter,
		wmBase + 60,
		0.5,
		[
			["Kills", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter,
		wmBase + 80,
		0.5,
		[
			["Deaths", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftLeftRowCenter,
		wmBase + 100,
		0.5,
		[
			["K/DR", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
}
	//bgImage = await drawMulticoloredText(bgImage,leftLeftRowCenter,wmBase + 100,0.5,[["Credits", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],],false,true);
	//bgImage = await drawMulticoloredText(bgImage,leftLeftRowCenter,wmBase + 120,0.5,[	["XP", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],	[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],],false,true	);

	let monthlyWLR = truncateToThreeDecimals(monthlyWins / monthlyLosses);
	if (!monthlyWLR) {
		monthlyWLR = 0;
	}
	let monthlyKDR = truncateToThreeDecimals(monthlyKills / monthlyDeaths);
	if (!monthlyKDR) {
		monthlyKDR = 0;
	}
	let mkdrColor = "#ffffff"
	if (monthlyKDR <= 0.5){
		mkdrColor = "#555555"
	} else if (monthlyKDR <= 1){
		mkdrColor = "#AAAAAA"
	} else if (monthlyKDR <= 1.5){
		mkdrColor = "#ffffff"
	} else if (monthlyKDR <= 2.5){
		mkdrColor = "#FFFF55"
	} else if (monthlyKDR <= 3.2){
		mkdrColor = "#FFAA00"
	} else if (monthlyKDR <= 4.5){
		mkdrColor = "#FF5555"
	} else if (monthlyKDR <= 6){
		mkdrColor = "#AA0000"
	} else if (monthlyKDR <= 10){
		mkdrColor = "#AA00AA"
	} else{
		mkdrColor = "#5555FF"
	}
	bgImage = await drawText(bgImage, `${monthlyWins}`, leftLeftRowCenter + 5, wmBase, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${monthlyLosses}`, leftLeftRowCenter + 5, wmBase + 20, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${monthlyWLR}`, leftLeftRowCenter + 5, wmBase + 40, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${monthlyKills}`, leftLeftRowCenter + 5, wmBase + 60, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${monthlyDeaths}`, leftLeftRowCenter + 5, wmBase + 80, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${monthlyKDR}`, leftLeftRowCenter + 5, wmBase + 100, 0.5, mkdrColor, true, scaleBrightness(mkdrColor, 0.2), 4, false, false);
	//bgImage = await drawText(bgImage, `${monthlyCredits}`, leftLeftRowCenter + 5, wmBase + 100, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	//bgImage = await drawText(bgImage, `${monthlyXp}`, leftLeftRowCenter + 5, wmBase + 120, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	if (unbaked){
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter,
		wmBase,
		0.5,
		[
			["Wins", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter,
		wmBase + 20,
		0.5,
		[
			["Losses", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter,
		wmBase + 40,
		0.5,
		[
			["W/LR", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter,
		wmBase + 60,
		0.5,
		[
			["Kills", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter,
		wmBase + 80,
		0.5,
		[
			["Deaths", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
	bgImage = await drawMulticoloredText(
		bgImage,
		leftRightRowCenter,
		wmBase + 100,
		0.5,
		[
			["K/DR", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],
			[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],
		],
		false,
		true
	);
}
	//bgImage = await drawMulticoloredText(bgImage,leftRightRowCenter,wmBase + 100,0.5,[["Credits", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],],false,true);
	//bgImage = await drawMulticoloredText(bgImage,leftRightRowCenter,wmBase + 120,0.5,[	["XP", "#55FFFF", true, scaleBrightness("#55FFFF", 0.2), 4, false],	[":", "#FFFFFF", true, scaleBrightness("#FFFFFF", 0.2), 4, false],],false,true	);
	let weeklyWLR = truncateToThreeDecimals(weeklyWins / weeklyLosses);
	if (!weeklyWLR) {
		weeklyWLR = 0;
	}
	let weeklyKDR = truncateToThreeDecimals(weeklyKills / weeklyDeaths);
	if (!weeklyKDR) {
		weeklyKDR = 0;
	}
	let wkdrColor = "#ffffff"
	if (weeklyKDR <= 0.5){
		wkdrColor = "#555555"
	} else if (weeklyKDR <= 1){
		wkdrColor = "#AAAAAA"
	} else if (weeklyKDR <= 1.5){
		wkdrColor = "#ffffff"
	} else if (weeklyKDR <= 2.5){
		wkdrColor = "#FFFF55"
	} else if (weeklyKDR <= 3.2){
		wkdrColor = "#FFAA00"
	} else if (weeklyKDR <= 4.5){
		wkdrColor = "#FF5555"
	} else if (weeklyKDR <= 6){
		wkdrColor = "#AA0000"
	} else if (weeklyKDR <= 10){
		wkdrColor = "#AA00AA"
	} else{
		wkdrColor = "#5555FF"
	}
	bgImage = await drawText(bgImage, `${weeklyWins}`, leftRightRowCenter + 5, wmBase, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${weeklyLosses}`, leftRightRowCenter + 5, wmBase + 20, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${weeklyWLR}`, leftRightRowCenter + 5, wmBase + 40, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${weeklyKills}`, leftRightRowCenter + 5, wmBase + 60, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${weeklyDeaths}`, leftRightRowCenter + 5, wmBase + 80, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	bgImage = await drawText(bgImage, `${weeklyKDR}`, leftRightRowCenter + 5, wmBase + 100, 0.5, wkdrColor, true, scaleBrightness(wkdrColor, 0.2), 4, false, false);
	//bgImage = await drawText(bgImage, `${weeklyCredits}`, leftRightRowCenter + 5, wmBase + 100, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);
	//bgImage = await drawText(bgImage, `${weeklyXp}`, leftRightRowCenter + 5, wmBase + 120, 0.5, "#ffffff", true, scaleBrightness("#ffffff", 0.2), 4, false, false);

	//skin "unknown_skin.png"
	if (!skinData) {
		skinData = "./assets/unknown_skin.png";
	}
	let playerImage = await Jimp.read(skinData);
	playerImage.scale(0.57);
	await bgImage.blit(playerImage, 490, 170);
	/* test bs
  bgImage = await drawText(bgImage, "aaaaaaaaa", 1, 1, .7, "#ffffff", true, "#000000", 4, true);
  bgImage = await drawText(bgImage, "bbbbbbbb", 1, 50, 1.0, "#ffffff", false, "#000000", 4, false);
  bgImage = await drawText(bgImage, "cccccccc", 1, 100, 1.0, "#ffffff", true, "#000000", 4, false);
  bgImage = await drawText(bgImage, "dddddddd", 1, 150, 1.0, "#ffffff", false, "#000000", 4, true);
  bgImage = await drawText(bgImage, "Lioncat6", 1, 200, 2, "#00ff00", true, "#000000", 4, true);
  */
	 
	//console.log(Date.now() - t1);
	//bgImage.write(output);// save
	const outputBuffer = await bgImage.getBufferAsync(Jimp.MIME_PNG);
	return outputBuffer
}


module.exports = {
	createPlayerPictureText
}