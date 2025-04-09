const { SlashCommandBuilder } = require('discord.js');

const pretrivia = require('../resources/quizvragen/quiz.json');
const triviaFilm = require('../resources/quizvragen/quiz-film-tv.json');
const triviaaa = require('../resources/quizvragen/quiz-aa.json');
const triviaMuziek = require('../resources/quizvragen/quiz-muziek.json');
const triviaSport = require('../resources/quizvragen/quiz-sport.json');

const triviaGesch = require('../resources/quizvragen/quiz-geschiedenis.json');
const triviaDisney = require('../resources/quizvragen/quiz-disney.json');
const triviaLogo = require('../resources/quizvragen/quiz-logo.json');
const triviaEmote = require('../resources/quizvragen/quiz-emote.json');

var vragenStorage = {
    triviaFilm: triviaFilm.concat(triviaDisney),
    triviaaa: triviaaa, 
    triviaMuziek: triviaMuziek,
    triviaSport: triviaSport,

    triviaGesch: triviaGesch,
    triviaDisney: triviaDisney,
    triviaLogo: triviaLogo,
    triviaEmote: triviaEmote,

    trivia:  pretrivia.concat(triviaFilm, triviaMuziek, triviaSport, triviaGesch, triviaDisney, triviaLogo, triviaEmote)
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName("trivia")
    .setDescription("Quizmaster Gilles stelt je een vraag, aan jou om het juiste antwoord te geven")
    .addStringOption(option =>
        option.setName("module")
        .setDescription("De module waar je een vraag uit wil")
        .addChoices(
            { name: "Film", value: "triviaFilm" },
            { name: "Aardrijkskunde", value: "triviaaa" },
            { name: "Muziek", value: "triviaMuziek" },
            { name: "Sport", value: "triviaSport" },
            { name: "Geschiedenis", value: "triviaGesch" },
            { name: "Disney", value: "triviaDisney" },
            { name: "Logo", value: "triviaLogo" },
            { name: "Emote", value: "triviaEmote" },
        )),

    async execute(interaction) {
        await interaction.deferReply();

        let module = interaction.options.getString("module") ?? "trivia";

        const vragen = vragenStorage[module];

        const vraag = vragen[Math.floor(Math.random()*(vragen.length))];
        const filter = response => {
            return vraag.answers.some(answer => answer.toLowerCase() === response.content.toLowerCase() || response.content.toLowerCase() === "pas");
        }

        interaction.editReply({
            embeds: [{
                title: "TRIVIA",
                description: vraag.question,
                image: {
                    url: vraag.image
                },
                color: 0xb9673c
            }],
            fetchReply: true
        }).then(() => {
            interaction.channel.awaitMessages({filter: filter, max: 1, time: 30000, errors: ['time']})
            .then(collected => {
                if (collected.first().content === "pas" || collected.first().content === "Pas") {
                    interaction.followUp(`${collected.first().author}` + ' paste. \nHet juiste antwoord was: "' + vraag.answers[0]+ '".')
                } else {
                    interaction.followUp(`${collected.first().author} heeft het juist!`);
                }
            })
            .catch(() => {
                interaction.followUp('Time-out: niemand beantwoordde de vraag juist. \nHet juiste antwoord was: "' + vraag.answers[0]+ '".');
            });
        })
    },

    info: "Quizmaster Gilles stelt een vraag"
}
