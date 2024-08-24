const { Client, ActivityType } = require('discord.js');
module.exports = {
	name: 'guildCreate',
	execute(guild) {
		let client = guild.client
        const Guilds = [];
		let numGuilds = 0
		client.guilds.cache.forEach(guild => {
			Guilds.push([guild.id, guild.name, guild.memberCount]);
			numGuilds = numGuilds+1
		});

		client.user.setPresence({
			activities: [{ name: `/help | ${numGuilds} Servers`, type: ActivityType.Playing }],
			status: 'online',
	 	 });
		console.log(Guilds)
		
		console.log(`Joined New Guild: `, [guild.id, guild.name, guild.memberCount],  (new Date(Date.now()).toLocaleString()));
	},
};