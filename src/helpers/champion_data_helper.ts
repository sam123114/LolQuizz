import * as fs from 'fs';
import { ChampionData, Champions } from '../types';
import logger from '../utils/logger';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fetch = require('node-fetch');

const DATA_FILE_PATH = './data/champion_data.json';
const DATA_FOLDER_PATH = './data';

let version: string;

export function updateChampionData(lastestVersion: string): void {
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
            fetchChampionData(lastestVersion).then((newChampionData) => {
                if (!fs.existsSync(DATA_FOLDER_PATH)) {
                    createFolder(DATA_FOLDER_PATH);
                }
                writeFileSync(DATA_FILE_PATH, JSON.stringify(newChampionData));
                logger.info('Champion data file was updated. New version: ' + lastestVersion);
            });
        } else {
            logger.info('No update available');
        }
    } catch (ex) {
        logger.error(ex);
    }
}

export function getChampions(): Champions {
    const champion_data = readFileSync(DATA_FILE_PATH);
    return champion_data.data;
}

export function getVersion(): string {
    return version;
}

//private functions
function fetchChampionData(version: string): Promise<ChampionData> {
    return fetch(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`)
        .then((res: { json: () => Promise<ChampionData> }) => res.json())
        .then((json: ChampionData) => json)
        .catch(logger.error);
}

function readFileSync(filePath: string): ChampionData {
    const data = fs.readFileSync(filePath, 'utf-8'); // Added encoding
    return JSON.parse(data) as ChampionData;
}

function createFolder(folderPath: string): void {
    fs.mkdirSync(folderPath);
}

function writeFileSync(filePath: string, jsonString: string): void {
    fs.writeFileSync(filePath, jsonString);
}
