import { Command } from './command';
import { Message } from "discord.js";
import { FCBot } from './FCBot';
import { Color } from './utils/color';


export interface OptionDefinition {
    name: string;
    alias?: string;
    type: any;
    description?: string;
    typeLabel?: string;
    multiple?: Boolean;
    defaultOption?: Boolean;
}

export interface UsageDefinition {
    description?: string;
    header: string;
    content?: string;
    optionList?: OptionDefinition[];
}

export abstract class AbstractCommand implements Command {

    protected abstract prefix: string;
    protected abstract optionsDefinition: OptionDefinition[];
    protected abstract usageDefinition: UsageDefinition[];

    protected message: Message;
    protected textMessage: string = '';
    protected options: any = {};


    protected subcommand: string = '';

    abstract execute(): void;

    protected constructor(message: Message) {
        this.message = message;
    }

    showUsage() {
        const embed = this.prepareUsage();
        this.message.channel.send(embed);
    }

    protected prepareUsage() {
        const embed = FCBot.embed();
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
        const embed = FCBot.embed()
            .setDescription(message)
            .setColor(Color.RED)
        ;
        this.message.channel.send(embed);
    }
}
