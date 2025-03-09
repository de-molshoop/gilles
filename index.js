const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActivityType} = require('discord.js');
const { token, site, port, log_channel_quiz, CLIENT_ID_AUTH, CLIENT_SECRET_AUTH } = require('./config.json');
const axios = require("axios");
const express = require('express');

const client = new Client({ intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]});

const app = express();


const ALLOWED_ORIGIN = site;
const REDIRECT_URI = `${site}auth/callback`;

app.use((req, res, next) => {
    const origin = req.get('Origin');
    if (origin !== ALLOWED_ORIGIN) {
        return res.status(403).json({ success: false, error: 'Forbidden: Invalid origin' });
    }
    next();
});

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


// EXPRESS
app.post('/quiz', async (req, res) => {
    const { message } = req.body;
    const channelId = log_channel_quiz;

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

app.post("/api/auth/discord", async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: "No code provided" });
    }

    try {
        const params = new URLSearchParams({
            client_id: CLIENT_ID_AUTH,
            client_secret: CLIENT_SECRET_AUTH,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: REDIRECT_URI,
            scope: "identify guilds",
        });

        const tokenResponse = await axios.post(
            "https://discord.com/api/oauth2/token",
            params,
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const tokenData = tokenResponse.data;

        if (!tokenData.access_token) {
            return res.status(400).json({ error: "Invalid token response" });
        }

        const userResponse = await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const userData = userResponse.data;

        const guildsResponse = await axios.get("https://discord.com/api/users/@me/guilds", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const guildsData = guildsResponse.data;

        // console.log(guildsData)

        res.json({
            access_token: tokenData.access_token,
            user: userData,
            guilds: guildsData,
        });
    } catch (error) {
        // console.error("OAuth Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
