const fs = require('fs');
const fetch = require("node-fetch");
const { resolve } = require('path');

const dataFilePath = './data/champion_data.json';

exports.updateChampionData = function(lastestVersion) {
    try{
        const champion_data = ReadFileSync(dataFilePath);
        if (champion_data['version'] !== lastestVersion) {
            fetchChampionData(lastestVersion).then(new_champion_data => {
                WriteFileSync(dataFilePath, JSON.stringify(new_champion_data));
                console.log("Champion data file was updated. New version: " + lastestVersion);
            });
        } else {
            console.log('No update available');
        }
    } catch (ex) {
        console.log(ex);
    }
}

exports.selectChampionRandomly = function () {
    const champion_data = ReadFileSync(dataFilePath);
    let champions = Object.keys(champion_data.data);
    let champion = champions[Math.floor(Math.random() * Object.keys(champion_data.data).length)];
    return champion_data.data[champion];
}

//private functions
const fetchChampionData = function(version) {
    return fetch(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`).then(res => res.json()).then(json => json).catch(console.error);
}

const ReadFileSync = function(filePath) {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
}

const WriteFileSync = function(filePath, jsonString) {
    fs.writeFileSync(filePath, jsonString);
}