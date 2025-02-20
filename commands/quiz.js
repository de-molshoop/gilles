const { SlashCommandBuilder } = require('discord.js');

const prequiz = require('../resources/quizvragen/quiz.json');
const quizFilm = require('../resources/quizvragen/quiz-film-tv.json');
const quizaa = require('../resources/quizvragen/quiz-aa.json');
const quizMuziek = require('../resources/quizvragen/quiz-muziek.json');
const quizSport = require('../resources/quizvragen/quiz-sport.json');

const quizGesch = require('../resources/quizvragen/quiz-geschiedenis.json');
const quizDisney = require('../resources/quizvragen/quiz-disney.json');
const quizLogo = require('../resources/quizvragen/quiz-logo.json');
const quizEmote = require('../resources/quizvragen/quiz-emote.json');

var vragenStorage = {
    quizFilm: quizFilm,
    //quizaa: quizaa, 
    quizMuziek: quizMuziek,
    quizSport: quizSport,

    quizGesch: quizGesch,
    quizDisney: quizDisney,
    quizLogo: quizLogo,
    quizEmote: quizEmote,

    quiz:  prequiz.concat(quizFilm, quizMuziek, quizSport, quizGesch, quizDisney, quizLogo, quizEmote)
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("Quizmaster Gilles stelt je een vraag, aan jou om het juiste antwoord te geven")
    .addStringOption(option =>
        option.setName("module")
        .setDescription("De module waar je een vraag uit wil")
        .addChoices(
            { name: "Film", value: "quizFilm" },
            { name: "Aardrijkskunde", value: "quizaa" },
            { name: "Muziek", value: "quizMuziek" },
            { name: "Sport", value: "quizSport" },
            { name: "Geschiedenis", value: "quizGesch" },
            { name: "Disney", value: "quizDisney" },
            { name: "Logo", value: "quizLogo" },
            { name: "Emote", value: "quizEmote" },
        )),

    async execute(interaction) {
        await interaction.deferReply();

        let module = interaction.options.getString("module") ?? "quiz";

        const vragen = vragenStorage[module];

        const vraag = vragen[Math.floor(Math.random()*(vragen.length))];
        const filter = response => {
            return vraag.answers.some(answer => answer.toLowerCase() === response.content.toLowerCase() || response.content.toLowerCase() === "pas");
        }

        interaction.editReply({
            embeds: [{
                title: "QUIZ",
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

    info: "Quizmaster Doddy stelt een vraag"
}
