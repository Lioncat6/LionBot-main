const { Client, ActivityType } = require('discord.js');
module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
        client.user.setPresence({
  			activities: [{ name: `you use /help`, type: ActivityType.Watching }],
  			status: 'online',
		});
        const Guilds = [];
		client.guilds.cache.forEach(guild => {
			Guilds.push([guild.id, guild.name, guild.memberCount]);
		});


        console.log(Guilds)
	},
};