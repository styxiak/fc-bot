import { Message } from 'discord.js';
import { Command } from '../command';


export class Pong implements Command{

    private message: Message;

    constructor(message: Message) {
        this.message = message;
    }

    execute() {
        this.message.reply('Hello!');
    }

}
