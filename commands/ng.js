const { SlashCommandBuilder, Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require("discord.js");
var request = require("request").defaults({ encoding: null });

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
        .addSubcommand((subcommand) =>
      subcommand
        .setName("settings")
        .setDescription("Configure roles for this command")
    )
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
        .addStringOption((option) => option.setName("game").setDescription("Game mode to fetch stats for").setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("playerpicture")
        .setDescription("Generate player picture")
        .addStringOption((option) => option.setName("ign").setDescription("Name of the player on the NetherGames server").setRequired(true))
    )
    .addSubcommand((subcommand) => subcommand.setName("online").setDescription("Fetch online player count")),
  async execute(interaction) {
    try { await interaction.deferReply(); } catch (error) {throw new Error(error)}
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
              value: `${json["level"]} (${json["xpToNextLevel"]} xp to ${json["level"]+1})`
            },
            {
              name: "Xp",
              value: `${json["xp"]}`
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
        var voted = "no"
        if (json["voteStatus"] == 1){
          voted = "yes"
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
          banned = `Banned Until: ${new Date(json["bannedUntil"] * 1000).toLocaleString().replace(/  /g, " ")} (In ${Math.floor(
            (json["bannedUntil"] - Date.now() / 1000) / 86400
          )} days)`;
        }
        var muted = "no";
        if (json["muted"]) {
          muted = `Muted Until: ${new Date(json["mutedUntil"] * 1000).toLocaleString().replace(/  /g, " ")} (In ${Math.floor(
            (json["mutedUntil"] - Date.now() / 1000) / 86400
          )} days)`;
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
              value: `${voted}`
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
                'User-Agent': 'LionBot-Discord-Bot <lioncat6pmc@gmail.com>', // Your custom User-Agent string
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              });
            
              const skinDataResponse = await fetch(url, {
                method: 'GET',
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
            const skinEmbed = new EmbedBuilder().setColor(0xd79b4e).setTitle(`${json["name"]}'s skin`).setImage('attachment://file.jpg').setTimestamp(Date.now());
            await interaction.editReply({ embeds: [skinEmbed], files: [file] });
          } else {
            throw new Error(`NetherGames API error: ${skinResponse.status}`);
          }
        } else {
          const skinEmbed = new EmbedBuilder().setColor(0xd79b4e).setTitle(`${json["name"]}'s skin`).setURL(skinUrl).setImage(skinUrl).setTimestamp(Date.now() );
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
      } else {
        throw new Error(error);
      }
    }
  },
};
