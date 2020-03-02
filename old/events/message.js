'use strict';

let moment = require('moment');
const kick = require('../commands/kick');
let config = require('../data/config.json');

let simpleStorage = {};
const adminRoleName = 'FC Bot Admin';
module.exports = (client, message) => {
    if(message.author.id === client.user.id) return;
    if (message.content.startsWith('!kick')) {
        return kick(message)
    }
    if (message.content === '!ping') {
        message.channel.send(`pong na kanale ${message.channel}`);
    }
    if (message.content.startsWith('Dobranoc')) {
        message.channel.send(`Śpij dobrze ${message.member}!`);
    }
    if (message.content.includes('fc-bot')) {
        message.channel.send('Cześć! Nazywam się D-0. Kim jesteś?')
    }
    if (message.content === '!avatar') {
        message.reply(message.author.avatarURL);
    }

    if (message.content === '!config') {
        console.log('!config called', config);
        message.channel.send("Kiedyś będzie ładniej: " + JSON.stringify(config));
    }

    if (message.content.startsWith('!add.mention')) {
        if (!message.member.roles.some(role => role.name === adminRoleName)) {
            message.channel.send(`Aby użyc tej komendy musisz mieć rolę ${adminRoleName}`);
        }


        let mention = message.content.split(' ')[1];

        let mentionToAdd = '@' + mention;
        config.mentions.push(mentionToAdd);
        message.channel.send(mentionToAdd.replace('@', '~~@~~') + ' dodane.');
    }


    //właściwe sprawdzanie częstotliwości mentions
    config.mentions.forEach((value) => {
        if (message.content.indexOf(value) >= 0) {
            let now = moment();
            console.log('Mentions detected: ' + value + ' by user: ' + message.member);
            // zapisujemy
            if (!simpleStorage[message.member]) {
                simpleStorage[message.member] = [];
            }
            let userMentions = {
                time: message.createdAt,
            };
            let allowedAgo = now.subtract(config.howLong, 'minutes');
            console.log(allowedAgo);
            simpleStorage[message.member].push(userMentions);
            //zliczamy ile jest większych niż allowedAgo
            let counter = 0;
            simpleStorage[message.member].forEach((value) => {
                let momentValue = moment(value.time);
                console.log(momentValue);
                if (momentValue.isAfter(allowedAgo)) {
                    counter++;
                }
            });
            console.log(counter);
            console.log(simpleStorage);
            if (config.howMany - 1 === counter) {
                message.channel.send(`Jeszcze jedna wzmianka i zostaniesz uciszony ${message.member}`);
            }
            if (config.howMany === counter) {
                message.channel.send(`To był Twój ostatni raz ${message.member}`);
            }

            if (config.howMany < counter) {
                let roleName = '[muted]';
                const role = message.guild.roles.find('name', roleName);
                message.channel.send(`${message.member} dostaje rolę ${roleName} na X czasu. Jeszcze jej nie umiem zdejmować. :)`);
                message.member.addRole(role, 'Bo tak!');
            }
        }
    })
};
