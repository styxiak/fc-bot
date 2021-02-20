import {ERROR_CUSTOM_LEVELS, LoggerInterface} from "./logger-interface";
import {FCBot} from "../FCBot";
import {DiscordAPIError, MessageEmbed, TextChannel} from "discord.js";
import {Color} from "../utils/color";
import {EmbedUtils} from "../utils/embed-utils";
import {CHANNEL_ERROR_LOG} from "../types/channel";
import {Embed} from "../actions/embed";

export class DiscordLogger implements LoggerInterface {

    private embed: MessageEmbed;

    constructor() {
        this.embed = EmbedUtils.embed();
    }

    debug(msg: any, meta?: any): void {
        this.embed = EmbedUtils.embed();
        this.embed.setColor(ERROR_CUSTOM_LEVELS.colors.debug);
        this.embed.setTitle('Debug');
        this.sendMessage(msg, meta)
    }

    error(msg: any, meta?: any): void {
        let embed = EmbedUtils.embed();
        embed.setColor(ERROR_CUSTOM_LEVELS.colors.error);
        embed.setTitle('Error');
        this.sendMessage(embed, msg, meta)
    }

    log(msg: any, meta?: any): void {
        this.embed.setColor(ERROR_CUSTOM_LEVELS.colors.debug);
        this.embed.setTitle('Log');
        this.sendMessage(msg, meta)
    }

    trace(msg: any, meta?: any): void {
        this.embed.setColor(ERROR_CUSTOM_LEVELS.colors.trace);
        this.embed.setTitle('Trace');
        this.sendMessage(msg, meta)
    }

    warn(msg: any, meta?: any): void {
        this.embed.setColor(ERROR_CUSTOM_LEVELS.colors.warn);
        this.embed.setTitle('Warn');
        this.sendMessage(msg, meta)
    }

    sendMessage(embed: MessageEmbed, msg: any, meta?: any): void {
        let description = this.toString(msg);
        console.log('description', description);
        embed.setDescription(description);
        if (meta) {
            embed.addField('Meta', JSON.stringify(meta).substr(0, 1024));
        }
        let stackTrace = this.getStactTrace(msg);
        if (stackTrace) {
            embed.addField('Stack Trace', stackTrace.substr(0, 1024));
        }

        FCBot.client.channels.fetch(CHANNEL_ERROR_LOG).then(channel => (channel as TextChannel).send(embed));
    }

    toString(msg: any): string {
        console.log(JSON.stringify(msg));
        console.log(typeof msg);
        if (msg instanceof Error) {
            switch (msg.name) {
                case 'DiscordAPIError':
                    return msg.message;
            }
        }

        if (msg instanceof Object) {
            return msg.sqlMessage || msg.message;
        }

        return JSON.stringify(msg);
    }

    getStactTrace(msg: any) {
        if (msg instanceof Error) {

            return msg.stack;
        }

        return null;
    }
}
