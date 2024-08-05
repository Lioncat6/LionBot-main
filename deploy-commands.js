const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes, Client, GatewayIntentBits, Discord } = require('discord.js');
const { clientId, token } = require('./config.json');
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	try {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		commands.push(command.data.toJSON());
	} catch (error) {
		console.warn("Command failed to register: "+file)
		console.warn(error)
	}
}


const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationCommands(clientId), { body: commands })
.then(data => console.log(`Successfully registered ${data.length} application commands.`))
.catch(console.error);
