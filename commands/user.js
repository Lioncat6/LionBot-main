const { SlashCommandBuilder, Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Get profile information of selected user")
    .addUserOption((option) => option.setName("target").setDescription("The user")),
  async execute(interaction) {
	try { await interaction.deferReply(); } catch (error) {throw new Error(error)}
    var user = interaction.options.getUser("target");
    if (!user) {
      user = interaction.user;
    }
    user = await interaction.client.users.fetch(user.id, { force: true });
    let userFields = [];
    userFields.push({ name: "Account Created", value: `${user.createdAt} (<t:${parseInt(user.createdTimestamp / 1000)}:R>)` });
    userFields.push({ name: "Tag", value: `${user.tag} (<@${user.id}>)` });
    let userFlags = "none";
    let flags = user.flags;
    if (flags != 0 && flags) {
      userFlags = "";
      const Discord_Employee = 1;
      const Partnered_Server_Owner = 2;
      const HypeSquad_Events = 4;
      const Bug_Hunter_Level_1 = 8;
      const House_Bravery = 64;
      const House_Brilliance = 128;
      const House_Balance = 256;
      const Early_Supporter = 512;
      const Bug_Hunter_Level_2 = 16384;
      const Early_Verified_Bot_Developer = 131072;
      const Verified_Bot = 65536;
      const Verified_Developer = 131072;
      const Certified_Moderator = 262144;
      const Active_Developer = 4194304;
      const Deleted = 17179869184;
      const Self_Deleted = 68719476736;
      const Disabled = 2199023255552;
      const Disabled_Suspicious_Activity = 34359738368;
      const Spammer = 1048576;
      const System = 4096;
      const Team_Pseudo_User = 1024;
      if ((flags & Discord_Employee) == Discord_Employee) {
        userFlags = userFlags + "Discord Employee\n";
      }
      if ((flags & Partnered_Server_Owner) == Partnered_Server_Owner) {
        userFlags = userFlags + "Partnered Server Owner\n";
      }
      if ((flags & HypeSquad_Events) == HypeSquad_Events) {
        userFlags = userFlags + "HypeSquad Events\n";
      }
      if ((flags & Bug_Hunter_Level_1) == Bug_Hunter_Level_1) {
        userFlags = userFlags + "Bug Hunter Level 1\n";
      }
      if ((flags & House_Bravery) == House_Bravery) {
        userFlags = userFlags + "HypeSquad Bravery\n";
      }
      if ((flags & House_Brilliance) == House_Brilliance) {
        userFlags = userFlags + "HypeSquad Brilliance\n";
      }
      if ((flags & House_Balance) == House_Balance) {
        userFlags = userFlags + "HypeSquad Balance\n";
      }
      if ((flags & Early_Supporter) == Early_Supporter) {
        userFlags = userFlags + "Early Supporter\n";
      }
      if ((flags & Bug_Hunter_Level_2) == Bug_Hunter_Level_2) {
        userFlags = userFlags + "Bug Hunter Level 2\n";
      }
      if ((flags & Early_Verified_Bot_Developer) == Early_Verified_Bot_Developer) {
        userFlags = userFlags + "Early Verified Bot Developer\n";
      }
      if ((flags & Verified_Bot) == Verified_Bot) {
        userFlags = userFlags + "Verified Bot\n";
      }
      if ((flags & Verified_Developer) == Verified_Developer) {
        userFlags = userFlags + "Verified Developer\n";
      }
      if ((flags & Certified_Moderator) == Certified_Moderator) {
        userFlags = userFlags + "Certified Moderator\n";
      }
      if ((flags & Deleted) == Deleted) {
        userFlags = userFlags + "Deleted\n";
      }
      if ((flags & Self_Deleted) == Self_Deleted) {
        userFlags = userFlags + "Self Deleted\n";
      }
      if ((flags & Active_Developer) == Active_Developer) {
        userFlags = userFlags + "Active Developer\n";
      }
      if ((flags & Disabled) == Disabled) {
        userFlags = userFlags + "Disabled\n";
      }
      if ((flags & Disabled_Suspicious_Activity) == Disabled_Suspicious_Activity) {
        userFlags = userFlags + "Disabled Suspicious Activity\n";
      }
      if ((flags & Spammer) == Spammer) {
        userFlags = userFlags + "Spammer\n";
      }
      if ((flags & System) == System) {
        userFlags = userFlags + "System\n";
      }
      if ((flags & Team_Pseudo_User) == Team_Pseudo_User) {
        userFlags = userFlags + "Team Pseudo User\n";
      }
    }
    let isBot = "no";
    let isSystem = "no";
    if (user.bot) {
      isBot = "yes";
    }
    if (user.system) {
      isSystem = "yes";
    }
	userFields.push({ name: "User ID", value: user.id})
	userFields.push({ name: "Flags", value: userFlags})
    userFields.push({ name: "Bot", value: isBot });
    userFields.push({ name: "System", value: isSystem });
    const userEmbed = new EmbedBuilder()
      .setColor(user.hexAccentColor)
      .setTitle(`${user.displayName}'s Profile Information`)
      .setDescription(`<@${user.id}>'s Profile Information`)
      .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp(Date.now())
      .addFields(userFields);

    await interaction.editReply({ content: "", embeds: [userEmbed] });
  },
};
