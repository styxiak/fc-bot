import { Command } from './command';
import { Message } from "discord.js";
import { FCBot } from './FCBot';
import { Color } from './utils/color';
import {EmbedUtils} from "./utils/embed-utils";
import {REACT_ERROR, REACT_OK} from "./types/reactions";

const commandLineArgs = require("command-line-args");

export interface OptionDefinition {
    name: string;
    alias?: string;
    type: any;
    description?: string;
    typeLabel?: string;
    multiple?: Boolean;
    defaultOption?: Boolean;
    defaultValue?: any;
}

export interface UsageDefinition {
    description?: string;
    header: string;
    content?: string;
    optionList?: OptionDefinition[];
}

export interface SubOptionDefinition {
    [key: string]: OptionDefinition[];
}

export abstract class AbstractCommand implements Command {

    protected abstract prefix: string;
    protected abstract optionsDefinition: OptionDefinition[];
    protected abstract usageDefinition: UsageDefinition[];

    protected message: Message;
    protected textMessage: string = '';
    protected options: any = {};
    protected subcommand: string = '';
    protected command: string = '';

    abstract execute(): void;

    constructor(message: Message) {
        this.message = message;
    }

    protected parseOptions(messageContent?: string) {
        console.log(this.optionsDefinition);
        console.log('parseOptions:');
        if (!messageContent) {
            messageContent = this.message.content.trim();
        }
        let splittedMessage = messageContent.split(' ');
        let usedPrefix = splittedMessage[0];
        let forPrase = messageContent.replace(`${usedPrefix}`, '').trim();
        console.log(' forParse: ', forPrase);
        this.command = splittedMessage[0].replace(FCBot.prefix, '').toLowerCase();
        if (splittedMessage.length > 1) {
            this.subcommand = splittedMessage[1].toLowerCase();
        }

        let argv = forPrase.split(' ');
        let regex = new RegExp(`!${this.prefix}(.*)-- `);
        this.textMessage = messageContent.replace(regex, '').trim();
        let options = commandLineArgs(
            this.optionsDefinition, {
                argv: argv,
                partial: true,
                stopAtFirstUnknown: true,
                camelCase: true
            });
        this.options = options;

        console.log(' options', options);
        console.log(' this.options', this.options);
        console.log(' this.textMessage', this.textMessage);
    }

    showUsage() {
        const embed = this.prepareUsage();
        this.message.channel.send(embed);
    }

    protected prepareUsage() {
        const embed = EmbedUtils.embed();
        let title = `Pomoc dla komendy **!${this.prefix}**`;
        if (this.subcommand) {
            title += ` **${this.subcommand}**`;
        }

        embed.setTitle(title);
        this.usageDefinition.forEach((section: UsageDefinition) => {
            if (section.description) {
                embed.setDescription(section.description);
                return;
            }
            let header = `__**${section.header}**__`;
            let content = '';
            if (section.content) {
                content = section.content;
            } else if (section.optionList) {
                section.optionList.forEach((option: any) => {
                    if (option.alias) {
                        content += `**-${option.alias}**, `;
                    }
                    content += `**--${option.name}** `;
                    if (option.type !== Boolean) {
                        if (option.typeLabel) {
                            content += `${option.typeLabel} `;
                        } else {
                            content += `${option.type.name} `;
                        }
                    }
                    content += `${option.description}\n`;
                });
            } else {
                console.error('Bad usage definition ', section);
            }

            embed.addField(header, content);
        });

        return embed;
    }

    error(message: string) {
        const embed = EmbedUtils.embed()
            .setDescription(message)
            .setColor(Color.RED)
        ;
        this.message.channel.send(embed);
    }

    async replyError(message?: string) {
        await this.message.react(REACT_ERROR);
        if(message) {
            this.message.reply(message);
        }

    }

    async replaySuccess(message?: string) {
        await this.message.react(REACT_OK);
        if(message) {
            this.message.reply(message);
        }

    }
}
