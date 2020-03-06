import { Message } from 'discord.js';
import { Color } from '../utils/color';
import { AbstractCommand, OptionDefinition, UsageDefinition } from '../abstract-command';
import { FCBot } from '../FCBot';

const commandLineArgs = require("command-line-args");

enum ValidTypes {
    DEFAULT = 'default',
    WARNING = 'warning',
    SECCESS = 'success',
}

const anonTypes: { [key: string]: Color } = {
    default: Color.BLUE,
    help: Color.DEFAULT,
    warning: Color.DARK_RED,
    success: Color.GREEN,
};

export class Embed extends AbstractCommand {

    protected readonly prefix = 'embed';
    protected readonly optionsDefinition: OptionDefinition[];
    protected readonly usageDefinition: UsageDefinition[];

    constructor(message: Message) {
        super(message);
        console.log('constructor:');

        let validTypesString = (Object.values(ValidTypes).filter(value => typeof value === 'string') as string[]).map((val) => `${val}`).join(', ');
        this.optionsDefinition = [
            {
                name: 'help',
                alias: 'h',
                type: Boolean,
                description: 'Show help'
            },
            {
                name: 'type',
                alias: 't',
                type: String,
                description: 'Valid types: ' + validTypesString,
                typeLabel: '__type__',
            }
        ];

        this.usageDefinition = [
            {
                header: 'This will not be shown',
                description: 'Jakiś opis'
            },
            {
                header: 'Typical Example',
                content: '```!embed --type warning -- Some text to show aa announcement. It can be multiline.```'
            },
            {
                header: 'Options',
                optionList: this.optionsDefinition
            },
            {
                header: 'Additional',
                content: 'Project home: __https://github.com/me/example__'
            }
        ];
        this.parseOptions();

    }

    //todo rozbić na dwie jeśli są tylko parametry lub jest subkomnedda i przenieść do abstract
    private parseOptions() {
        console.log('parseOptions:');
        let messageContent = this.message.content.trim();
        if (messageContent === `!${this.prefix}`) {
            messageContent += ' -h';
        }
        let forPrase = messageContent.replace(`!${this.prefix}`, '').trim();
        console.log(' forParse: ', forPrase);
        let argv = forPrase.split(' ');
        let regex = new RegExp(`!${this.prefix}(.*)-- `);
        this.textMessage = messageContent.replace(regex, '').trim();
        this.options = commandLineArgs(
            this.optionsDefinition, {
                argv: argv,
                partial: true,
                stopAtFirstUnknown: true,
                camelCase: true
            });

        console.log(' this.options', this.options);
        console.log(' this.textMessage', this.textMessage);
    }

    execute(): void {
        console.log('execute:');
        console.log(' this.options.help', this.options.help);
        if (this.options.help) {
            this.showUsage();
            return;
        }

        if (this.options.type) {
            if (!(Object.values(ValidTypes).some((v) => v === this.options.type))) {
                //todo better message
                this.showUsage();
                return;
            }
        }

        const embed = FCBot.embed();
        let indexAnonType = this.options.type as string;
        console.log(indexAnonType);
        console.log(anonTypes);
        if(indexAnonType) {
            embed.setColor(anonTypes[indexAnonType]);
            console.log(anonTypes[indexAnonType]);
        }

        embed
            .setAuthor('Ogłoszenie', this.message.member.user.avatarURL)
            .setDescription(this.textMessage)
        ;

        this.message.channel.send(embed);
    }


}
