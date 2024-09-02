const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');
const sequelize = require('./db/database');


var childProcess = require('child_process');

function runScript(scriptPath, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });

}

// Now we can run a script and invoke a callback when complete, e.g.
runScript('./deploy-commands.js', function (err) {
    if (err) throw err;
    //console.log('forced deploy-commands.js to run lol');
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        client.commands.set(command.data.name, command);
    } catch (error) {
        console.warn("Failed to add command: " + file)
        console.warn(error)
    }
}

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		const errEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(`Error ❌`)
            .setDescription(`There was an error while executing this command!`)
		console.error(error);
        try {
            await interaction.reply({ content: '', embeds: [errEmbed], ephemeral: true });
        } catch {
            await interaction.editReply({ content: '', embeds: [errEmbed], ephemeral: true });
        }
		setTimeout(() => interaction.deleteReply(), 10000);
	}
});
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}
const Discord = require("discord.js");

sequelize.sync()
    .then(() => {
        console.log('Database & tables created!');
    }).catch(err => {
        console.error('Unable to connect to the database:', err);
    });

client.login(token);