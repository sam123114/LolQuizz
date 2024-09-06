const fs = require('fs');
const fetch = require("node-fetch");
const { resolve } = require('path');

const dataFilePath = './data/champion_data.json';

let version;

exports.updateChampionData = function (lastestVersion) {
    version = lastestVersion;
    try {
        let createOrUpdateFile = false;

        if (!fs.existsSync(dataFilePath)) {
            //if the file doesn't exist, we want to create it.
            createOrUpdateFile = true;
        } else {
            //if the file does exist, we want to update it if necessary.
            const championData = ReadFileSync(dataFilePath);
            if (championData.version !== lastestVersion) {
                createOrUpdateFile = true;
            }
        }

        if (createOrUpdateFile) {
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

exports.getChampions = function () {
    const champion_data = ReadFileSync(dataFilePath);
    return champion_data.data;
}

//private functions
const fetchChampionData = function (version) {
    return fetch(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`).then(res => res.json()).then(json => json).catch(console.error);
}

const ReadFileSync = function (filePath) {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
}

const WriteFileSync = function (filePath, jsonString) {
    fs.writeFileSync(filePath, jsonString);
}

exports.getVersion = function() {
    return version;
}