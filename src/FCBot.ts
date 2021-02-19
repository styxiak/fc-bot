import {Client, Discord, On} from '@typeit/discord';
import {ClientUser, Intents, Message, MessageEmbed, TextChannel} from 'discord.js';
import {Pong} from './actions/pong';
import {Mention} from './actions/mention';

import {Color} from './utils/color';
import {Embed} from './actions/embed';
import {Help} from './actions/help';
import {Abs} from './actions/abs';
import {Stats} from './actions/stats';
import {Covid} from './actions/covid';
import {Discord as DiscordCommand} from './actions/discord';
import {Officer} from "./actions/officer";
import {Guild} from "./actions/guild";
import {RosterWatcher} from "./actions/roster-watcher";
import {CHANNEL_LOG} from "./types/channel";

const cron = require("node-cron");

@Discord
export abstract class FCBot {

    static client: Client;
    static prefix: string = "!";
    private commandNotFoundMessage: string = "command not found...";

    static start() {
        this.client = new Client({ws: {intents: Intents.ALL}});
        this.client.login(
            process.env.BOT_TOKEN as string,
            `${__dirname}/*Discord.ts` // glob string to load the classes
        );
        // cron.schedule('* * * * *', function() {
        //     console.log('running a task every minute');
        //     FCBot.client.channels.fetch(channel).then((channel) => (channel as TextChannel).send('Cron'));
        // });
        let cronConfig = {
            timezone: 'Europe/Warsaw',
        };
        cron.schedule('6 6 * * *', function() {
            console.log('Run daily check');
            let rosterWatcher = new RosterWatcher();
            rosterWatcher.checkDaily();
        }, cronConfig);
    }

    @On("message")
    async onMessage(message: Message, client: Client) {
        let user = FCBot.client.user as ClientUser;
        if (user.id === message.author.id) {
            return;
        }
        let mentionCommand = new Mention(message);
        if (message.content[0] === FCBot.prefix) {
            let command;

            const cmd = message.content.split(' ')[0].replace(FCBot.prefix, "").toLowerCase();
            console.log(`command in inMessage: ${cmd}`);
            switch (cmd) {
                case "ping":
                    command = new Pong(message);
                    command.execute();
                    break;
                case 'mention':
                case 'mentions':
                case 'm':
                    mentionCommand.execute();
                    break;
                case "embed":
                    command = new Embed(message);
                    command.execute();
                    break;
                case "abs":
                    command = new Abs(message);
                    command.execute();
                    break;
                case "stats":
                    command = new Stats(message);
                    command.execute();
                    break;
                case "covid":
                    command = new Covid(message);
                    command.execute();
                    break;
                case "d":
                case "discord":
                    command = new DiscordCommand(message);
                    command.execute();
                    break;
                case 'officer':
                    command = new Officer(message);
                    command.execute();
                    break;
                case "help":
                    command = new Help(message);
                    command.execute();
                    break;
                case "guild":
                case "enlist":
                case "promote":
                case "demote":
                case "expel":
                case "retire":
                    command = new Guild(message);
                    command.execute();
                    break;
                case 'test':
                    command = new RosterWatcher();
                    command.checkDaily();
                    break;
                default:
                    message.reply(this.commandNotFoundMessage);
                    break;
            }
            return;
        }

        //inne wiadomości
        mentionCommand.watch();

    }

    static embed() : MessageEmbed {
        let user = FCBot.client.user as ClientUser;
        return new MessageEmbed()
            .setAuthor('D-O', user.displayAvatarURL(), 'https://github.com/styxiak/fc-bot')
            .setThumbnail('http://chuchmala.pl/static/bio_hazard.png')
            .setTimestamp()
            .setColor(Color.DEFAULT)
            .setFooter('D-O -.. -....- ---', 'http://chuchmala.pl/static/final-countdown/fc-icon.png');
    }

    static postLog(message: string|MessageEmbed) {
        FCBot.client.channels
            .fetch(CHANNEL_LOG).then((channel) => (channel as TextChannel)
            .send(message));
    }

}
