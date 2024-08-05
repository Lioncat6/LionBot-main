module.exports = {
	name: 'interactionCreate',
	execute(interaction) {
	  let cmdName = ""
	  if (interaction.commandName){
	    cmdName = interaction.commandName
	  }
	  let custId = ""
	  if (interaction.customId){
	    custId = "/"+interaction.customId
	  }
		try {
			if (interaction.inGuild()){
				if (interaction.guild) {
					console.log(`${interaction.user.tag} in #${interaction.channel.name} (${interaction.guild.name}) triggered an interaction, ${interaction.id} (${custId}${cmdName})  `);
				} else {
					console.log(`${interaction.user.tag} in an unknown server triggered an interaction, ${interaction.id} (${custId}${cmdName}) `);
				}
				
			} else{
				console.log(`${interaction.user.tag} in a direct message triggered an interaction, ${interaction.id} (${custId}${cmdName}) `);
			}
		} catch (error) {
			console.log("An error occurred while attempting to log this interaction!")
			console.log(error)
		}
	}
		
}