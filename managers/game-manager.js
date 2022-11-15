const LolQuizz = require('../lol_quizz.js');

var games = [];

exports.addGame = function (guildId, channel) {
    const game = new LolQuizz.LolQuizz(guildId, channel);
    games[guildId] = game;
    return game;
}

exports.clearGame = function (guildId) {
    games[guildId] = undefined;
}

exports.getGame = function (guildId) {
    return games[guildId] !== undefined ? games[guildId] : false;
}