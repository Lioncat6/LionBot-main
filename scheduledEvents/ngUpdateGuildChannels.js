const Guild = require("../db/Guild.js");
const { ngToken } = require("../config.json");
const { PermissionsBitField  } = require("discord.js");
const fetchHeaders = new Headers();
fetchHeaders.append("Content-Type", "application/json");
fetchHeaders.append("Authorization", `${ngToken}`);

module.exports = (client) => {
	setInterval(async () => {
		let guilds = await Guild.findAll({ where: { ngguildstatsenabled: true } })
			.then({})
			.catch((err) => {
				console.error("Unable to connect to the database:", err);
			});
		if (guilds) {
			for (let guild of guilds) {
				if (guild.ngguildname) {
					if (guild.ngonlinememberschannel || guild.ngguildmemberschannel || guild.nggxpchannel || guild.nglevelchannel || guild.ngrankchannel || guild.nggxptonextlevelchannel) {
						const guildName = guild.ngguildname;
						const response = await fetch(`https://api.ngmc.co/v1/guilds/${guildName}?expand=true`, {
							method: "GET",
							headers: fetchHeaders,
						});
						if (!response.ok) {
							if (response.status == 404) {
                                //throw new Error(`Guild not found!`);
                            }
                            //throw new Error(`NetherGames api error: ${response.status}`);
						} else {
							let json;
							json = await response.json();
							let onlineCount = 0;
							if (json["leader"]) {
								if (json["leader"]["online"]) {
									onlineCount = onlineCount + 1;
								}
							}
							if (json["officers"]) {
								for (const officer of json["officers"]) {
									if (officer["online"]) {
										onlineCount = onlineCount + 1;
									}
								}
							}
							if (json["members"]) {
								for (const member of json["members"]) {
									if (member["online"]) {
										onlineCount = onlineCount + 1;
									}
								}
							}

							let membersString = `Guild Members: ${json["memberCount"]} / ${json["maxSize"]}`;
							let onlineString = `Online Members: ${onlineCount} / ${json["memberCount"]}`;
							let position = json["position"];
							if (position < 1 || !position) {
								position = "Not Ranked";
							}
							let positionString = `Guild Rank: ${position}`;
							let levelString = `Guild Level: ${json["level"]}`;
							let xpToNextLevelString = `${json["xpToNextLevel"]} GXP to Level ${json["level"] + 1}`;
							let xpString = `Guild GXP: ${json["xp"]}`;

							if (guild.ngonlinememberschannel) {
								let channel = client.channels.cache.get(guild.ngonlinememberschannel);
								let botPermissions = channel.permissionsFor(client.user);
								if (botPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
									if (channel) channel.setName(onlineString);
								}
							}
							if (guild.ngguildmemberschannel) {
								let channel = client.channels.cache.get(guild.ngguildmemberschannel);
                                let botPermissions = channel.permissionsFor(client.user);
								if (botPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
									if (channel) channel.setName(membersString);
								}
							}
							if (guild.nggxpchannel) {
								let channel = client.channels.cache.get(guild.nggxpchannel);
                                let botPermissions = channel.permissionsFor(client.user);
								if (botPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
									if (channel) channel.setName(xpString);
								}
							}
							if (guild.nglevelchannel) {
								let channel = client.channels.cache.get(guild.nglevelchannel);
                                let botPermissions = channel.permissionsFor(client.user);
								if (botPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
									if (channel) channel.setName(levelString);
								}
							}
							if (guild.ngrankchannel) {
								let channel = client.channels.cache.get(guild.ngrankchannel);
                                let botPermissions = channel.permissionsFor(client.user);
								if (botPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
									if (channel) channel.setName(positionString);
								}
							}
							if (guild.nggxptonextlevelchannel) {
								let channel = client.channels.cache.get(guild.nggxptonextlevelchannel);
                                let botPermissions = channel.permissionsFor(client.user);
								if (botPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
									if (channel) channel.setName(xpToNextLevelString);
								}
							}
						}
					}
				}
			}
		} else {
			console.log("Database appears to be offline... did not update channel names!");
		}
	}, 5 * 60 * 1000); // 10 minutes in milliseconds
};
