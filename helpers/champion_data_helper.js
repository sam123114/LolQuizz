const fs = require('fs');
const fetch = require("node-fetch");
const { resolve } = require('path');

const DATA_FILE_PATH   = './data/champion_data.json';
const DATA_FOLDER_PATH = './data';

let version;

exports.updateChampionData = function (lastestVersion) {
    version = lastestVersion;
    try {
        let createOrUpdateFile = false;

        if (!fs.existsSync(DATA_FILE_PATH)) {
            //if the file doesn't exist, we want to create it.
            createOrUpdateFile = true;
        } else {
            //if the file does exist, we want to update it if necessary.
            const championData = readFileSync(DATA_FILE_PATH);
            if (championData.version !== lastestVersion) {
                createOrUpdateFile = true;
            }
        }

        if (createOrUpdateFile) {
            fetchChampionData(lastestVersion).then(newChampionData => {
                if (!fs.existsSync(DATA_FOLDER_PATH)) {
                    createFolder(DATA_FOLDER_PATH);
                }
                writeFileSync(DATA_FILE_PATH, JSON.stringify(newChampionData));
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
    const champion_data = readFileSync(DATA_FILE_PATH);
    return champion_data.data;
}

//private functions
const fetchChampionData = function (version) {
    return fetch(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`).then(res => res.json()).then(json => json).catch(console.error);
}

const readFileSync = function (filePath) {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
}

const createFolder = function (folderPath) {
    fs.mkdirSync(folderPath)
}

const writeFileSync = function (filePath, jsonString) {
    fs.writeFileSync(filePath, jsonString);
}

exports.getVersion = function() {
    return version;
}