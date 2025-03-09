const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActivityType} = require('discord.js');
const { token, port } = require('./config.json');
const express = require('express');

const client = new Client({ intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]});

const app = express();

/*
const ALLOWED_ORIGIN = "https://de-molshoop.github.io/"

app.use((req, res, next) => {
    const origin = req.get('Origin');
    if (origin !== ALLOWED_ORIGIN) {
        return res.status(403).json({ success: false, error: 'Forbidden: Invalid origin' });
    }
    next();
});
*/

app.use(express.json());

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath,file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command){
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    client.user.setPresence({
        activities:[ {
            name: "De Mol",
            type: ActivityType.Watching
        }]
    })
});

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isChatInputCommand()) {

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    }
});

client.on(Events.MessageCreate, async interaction => {
    if (interaction.author.bot) return
    if (interaction.mentions.has(client.user)) {
        await interaction.reply("hoi")
    }
})

client.login(token);

app.post('/quiz', async (req, res) => {
    const { message } = req.body;
    const channelId = '724622094230487076';

    try {
        const channel = await client.channels.fetch(channelId);
        if (channel.isTextBased()) {
            await channel.send(message || 'No content');
            return res.json({ success: true, message: 'Message sent!' });
        } else {
            return res.status(400).json({ success: false, error: 'Invalid channel' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'Failed to send message' });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
