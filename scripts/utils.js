async function safeEditReply(interaction, content) {
    try {
      await interaction.editReply(content);
    } catch (error) {
      console.error("Failed to edit reply:", error);
      //throw new Error("Failed to edit reply:", error);
      /*
      try {
        await interaction.channel.send(content);
      } catch (innerError) {
        console.error("Failed to send new message:", innerError);
      }
        */
    }
}

module.exports = {
    safeEditReply
}
