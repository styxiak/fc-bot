import { Discord, Client, On } from '@typeit/discord';
import { Message } from 'discord.js';
import { Kick } from './actions/Kick';
import { Pong } from './actions/Pong';
import { Mention } from './actions/Mention';

import { config } from 'dotenv';

config();

@Discord
export abstract class FCBot {

    private static client: Client;
    private prefix: string = "!";
    private commandNotFoundMessage: string = "command not found...";

    static start() {
        this.client = new Client();
        // In the login method, you must specify the glob string to load your classes (for the framework).
        // In this case that's not necessary because the entry point of your application is this file.
        this.client.login(
            process.env.BOT_TOKEN as string,
            `${__dirname}/*Discord.ts` // glob string to load the classes
        );
    }

    @On("message")
    async onMessage(message: Message, client: Client) {
        // Your logic...
        if (FCBot.client.user.id === message.author.id) {
            return;
        }
        let mentionCommand = new Mention(message);
        if (message.content[0] === this.prefix) {
            let command;

            const cmd = message.content.split(' ')[0].replace(this.prefix, "").toLowerCase();
            console.log(cmd);
            console.log(Mention.prefix);
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
                case Mention.prefix:
                    mentionCommand.execute();
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

}
