import {Message} from "discord.js";

export class Test {

    static execute(message: Message) {
        throw new Error('error test');
    }
}
