const kick = require('../commands/kick');

module.exports = (client, message) => {
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
};
