import {GuildMember, Message} from 'discord.js';
import { Color } from '../utils/color';
import { AbstractCommand, OptionDefinition, UsageDefinition } from '../abstract-command';
import { FCBot } from '../FCBot';
import {EmbedUtils} from "../utils/embed-utils";
import {enumToString} from "../utils/util.functions";

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
    protected optionsDefinition: OptionDefinition[] = [
        {
            name: 'help',
            alias: 'h',
            type: Boolean,
            description: 'Pomoc'
        },
        {
            name: 'type',
            alias: 't',
            type: String,
            description: 'Poprawne wartości: default, warning, success',
            typeLabel: '__type__',
        }
    ];
    protected readonly usageDefinition: UsageDefinition[] = [
        {
            header: 'xxx',
            description: 'Komenda pozwala na zamieszczanie ładnych ogłoszeń.'
        },
        {
            header: 'Przykład',
            content: '```!embed --type warning -- Tekst, który chcemy zaby pojawił się w ogłoszeniu. Musi on być poprzedzony znakami --.```'
        },
        {
            header: 'Opcje',
            optionList: this.optionsDefinition
        }
    ];

    constructor(message: Message) {
        super(message);
        this.parseOptions();
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

        const embed = EmbedUtils.embed();
        let indexAnonType = this.options.type as string;
        console.log(indexAnonType);
        console.log(anonTypes);
        if(indexAnonType) {
            embed.setColor(anonTypes[indexAnonType]);
            console.log(anonTypes[indexAnonType]);
        }

        let member = this.message.member as GuildMember;
        embed
            .setAuthor('Ogłoszenie', member.user.displayAvatarURL())
            .setDescription(this.textMessage)
        ;

        this.message.channel.send(embed);
    }


}
