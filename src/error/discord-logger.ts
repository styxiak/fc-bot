import {ERROR_CUSTOM_LEVELS, LoggerInterface} from "./logger-interface";
import {FCBot} from "../FCBot";
import {MessageEmbed, TextChannel} from "discord.js";
import {Color} from "../utils/color";
import {EmbedUtils} from "../utils/embed-utils";
import {CHANNEL_ERROR_LOG} from "../types/channel";

export class DiscordLogger implements LoggerInterface {

    private embed: MessageEmbed;

    constructor() {
        this.embed = EmbedUtils.embed();
    }

    debug(msg: any, meta?: any): void {
        this.embed.setColor(ERROR_CUSTOM_LEVELS.colors.debug);
        this.embed.setTitle('Debug');
        this.sendMessage(msg, meta)
    }

    error(msg: any, meta?: any): void {
        this.embed.setColor(ERROR_CUSTOM_LEVELS.colors.error);
        this.embed.setTitle('Error');
        this.sendMessage(msg, meta)
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

    sendMessage(msg: any, meta?: any): void {
        this.embed.setDescription(this.toString(msg));
        if (meta) {
            this.embed.addField('Meta', meta);
        }
        let stackTrace = this.getStactTrace(msg);
        if (stackTrace) {
            this.embed.addField('Stack Trace', stackTrace);
        }

        FCBot.client.channels.fetch(CHANNEL_ERROR_LOG).then(channel => (channel as TextChannel).send(this.embed));
        this.embed = EmbedUtils.embed();
    }

    toString(msg: any) {
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
