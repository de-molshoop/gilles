const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("say")
        .setDescription("Laat Gilles iets zeggen")
        .addStringOption(option =>
            option.setName("tekst")
                .setDescription("De tekst die Gilles zal zeggen, gebruik \\n voor een nieuwe lijn."))
        .addStringOption(option =>
            option.setName("titel")
                .setDescription("De titel van het bericht dat Gilles zal zeggen"))
        .addAttachmentOption(option =>
            option.setName("foto")
                .setDescription("Een foto die Gilles bij het bericht voegt"))
        .addBooleanOption(option =>
            option.setName("thread")
                .setDescription("Moet Gilles een thread toevoegen bij dit bericht?")),

    async execute(interaction) {
        let text = interaction.options.getString("tekst");
        let titel = interaction.options.getString("titel");
        let img = interaction.options.getAttachment("foto");
        let thread = interaction.options.getBoolean("thread") ?? false;

        let url

        if (text !== null) text = text.replaceAll("\\n", "\n")

        if (img == null) {
            url = ""
        } else {
            url = img.url
        }

        let response = await interaction.channel.send({
            embeds: [{
                title: titel,
                description: text,
                image: {
                    url: url
                },
                color: 0xb9673c
            }]
        })

        if (thread) {
            await response.startThread({
                name: titel ?? "thread",
                auotArchiveDuration: 60
            })
        }

        await interaction.reply("Successfully spoken")
        await interaction.deleteReply()
    },

    info: "Laat Doddy iets zeggen"
}
