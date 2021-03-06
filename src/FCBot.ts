import {Client, Discord, On} from '@typeit/discord';
import {ClientUser, Guild as DiscordGuild, Intents, Message, MessageEmbed, TextChannel} from 'discord.js';
import {Pong} from './actions/pong';
import {Mention} from './actions/mention';
import {Embed} from './actions/embed';
import {Help} from './actions/help';
import {Stats} from './actions/stats';
import {Covid} from './actions/covid';
import {Discord as DiscordCommand} from './actions/discord';
import {CHANNEL_ERROR_LOG, CHANNEL_LOG} from "./types/channel";
import {Test} from "./actions/test";
import {Gl} from "./actions/gl";
import {Guild} from "./actions/guild";
import {Cpit} from "./actions/cpit";
import {REACT_ERROR, REACT_WAIT} from "./types/reactions";

@Discord
export abstract class FCBot {

    static client: Client;
    static prefix: string = "!";
    private commandNotFoundMessage: string = "command not found...";

    static start() {
        FCBot.client = new Client({ws: {intents: Intents.ALL}});
        return this.client.login(
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
        if (message.content[0] === FCBot.prefix) {
            let command;
            await message.react(REACT_WAIT);
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
                case 'cpit':
                case 'a':
                case 'add':
                case 'del':
                    command = new Cpit(message);
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
                case 'gl':
                    command = new Gl();
                    command.execute();
                    break;
                case 'test':
                case 't':
                    Test.execute(message);
                    break;
                default:
                    await message.react(REACT_ERROR);
                    message.reply(this.commandNotFoundMessage);
                    break;
            }
            return;
        }

        //inne wiadomości
        mentionCommand.watch();

    }

    static postLog(message: string|MessageEmbed) {
        FCBot.client.channels
            .fetch(CHANNEL_LOG).then((channel) => (channel as TextChannel).send(message));
    }

    static postError(message: string|MessageEmbed) {
        FCBot.client.channels
            .fetch(CHANNEL_ERROR_LOG).then((channel) => (channel as TextChannel).send(message));
    }

    static getGuild(): DiscordGuild {
        return FCBot.client.guilds.cache.get('409376390308167682') as DiscordGuild;
    }

}
