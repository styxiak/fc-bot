'use strict';

require('dotenv').config();
const fs = require('fs');

let config = {
    mentions: [],
    howMany: 3,
    howLong: 60
};

const Discord = require('discord.js');
const client = new Discord.Client();
fs.readdir('./events/', (err, files) => {
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
});

fs.readdir('./events/', (err, files) => {
    files.forEach(file => {
        const eventHandler = require(`./events/${file}`);
        const eventName = file.split('.')[0];
        client.on(eventName, (...args) => eventHandler(client, ...args))
    })
});

client.login(process.env.BOT_TOKEN);


fs.readFile('./data/config.json', (err,data) => {
    if (err) {
        //try to save
        fs.writeFile('./data/config.json', JSON.stringify(config), (err) = {
            if (err) {
                console.log('Error saving file:', err);
            }
        });
        return;
    }
    config = data;
});

