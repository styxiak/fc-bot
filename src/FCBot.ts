import { Discord, Client, On } from '@typeit/discord';
import {ClientUser, Intents, Message, MessageEmbed} from 'discord.js';
import { Kick } from './actions/kick';
import { Pong } from './actions/pong';
import { Mention } from './actions/mention';

import { Color } from './utils/color';
import { Embed } from './actions/embed';
import { Help } from './actions/help';
import { Abs } from './actions/abs';
import { Stats } from './actions/stats';
import { Covid } from './actions/covid';
import { Discord as DiscordCommand } from './actions/discord';

@Discord
export abstract class FCBot {

    static client: Client;
    private prefix: string = "!";
    private commandNotFoundMessage: string = "command not found...";

    static start() {
        this.client = new Client({ws: {intents: Intents.ALL}});
        this.client.login(
            process.env.BOT_TOKEN as string,
            `${__dirname}/*Discord.ts` // glob string to load the classes
        );
    }

    @On("message")
    async onMessage(message: Message, client: Client) {
        let user = FCBot.client.user as ClientUser;
        if (user.id === message.author.id) {
            return;
        }
        let mentionCommand = new Mention(message);
        if (message.content[0] === this.prefix) {
            let command;

            const cmd = message.content.split(' ')[0].replace(this.prefix, "").toLowerCase();
            console.log(`command in inMessage: ${cmd}`);
            switch (cmd) {
                case 'kick':
                    command = new Kick(message);
                    command.execute();
                    break;
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
                case "discord":
                    command = new DiscordCommand(message);
                    command.execute();
                    break;
                case "help":
                    command = new Help(message);
                    command.execute();
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
            .setURL('https://github.com/styxiak/fc-bot')
            .setAuthor('D-O', user.displayAvatarURL())
            .setThumbnail('http://chuchmala.pl/static/bio_hazard.png')
            .setTimestamp()
            .setColor(Color.DEFAULT)
            .setFooter('D-O -.. -....- ---', 'http://chuchmala.pl/static/final-countdown/fc-icon.png');
    }

}
