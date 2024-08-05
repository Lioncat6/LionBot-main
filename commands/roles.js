const { SlashCommandBuilder, Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("roles").setDescription("Fetch server roles"),
  async execute(interaction) {
    try { await interaction.deferReply(); } catch (error) {throw new Error(error)}
    if (interaction.inGuild() && interaction.guild) {
      var rolesText = "";
      var roles = await interaction.guild.roles.fetch();
      var rolesCount = roles.size;
      for (var x of roles) {
        //(${x[1]["members"].size}) but it doesn't work right
        rolesText = rolesText + `<@&${x[0]}> \n`;
      }
      function splitRolesList(rolesList) {
        const maxChunkLength = 1024;
        const roleMentions = rolesList.split(/\s+/); // Split by whitespace

        let currentChunk = "";
        const chunks = [];

        for (const mention of roleMentions) {
          if (currentChunk.length + mention.length + 1 <= maxChunkLength) {
            // Add the mention to the current chunk
            currentChunk += ` \n${mention}`;
          } else {
            // Start a new chunk
            chunks.push(currentChunk.trim());
            currentChunk = mention;
          }
        }
        // Add the last chunk
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        return chunks;
      }
      let embedFields = []
      const splitList = splitRolesList(rolesText)
      for (x in splitList){
        if (x > 0){
            embedFields.push({name:"---", value: `${splitList[x]}`})
        } else {
            embedFields.push({name:"\u200B", value: `${splitList[x]}`})
        }
        
      }
      const rolesEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`Roles (${rolesCount})`)
        .setDescription("Displays all Guild Roles")
        .addFields(embedFields)
        .setFooter({
          text: "For more information about each role use /role",
        })
        .setTimestamp(Date.now());
      await interaction.editReply({ content: "", embeds: [rolesEmbed] });
    } else if (interaction.inGuild()) {
      await interaction.editReply({ content: "This command only works in guilds the bot has permissions in!", ephemeral: true });
    } else {
      await interaction.editReply({ content: "This command only works in guilds!", ephemeral: true });
    }
  },
};
