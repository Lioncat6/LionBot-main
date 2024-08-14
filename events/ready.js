const { Client, ActivityType } = require('discord.js');
module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
        
        const Guilds = [];
		let numGuilds = 0
		client.guilds.cache.forEach(guild => {
			Guilds.push([guild.id, guild.name, guild.memberCount]);
			numGuilds = numGuilds+1
		});

		client.user.setPresence({
			activities: [{ name: `you use /help | ${numGuilds} Servers`, type: ActivityType.Watching }],
			status: 'online',
	 	 });

        console.log(Guilds)
	},
};