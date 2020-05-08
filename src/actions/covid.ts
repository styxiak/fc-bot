import { AbstractCommand, OptionDefinition, UsageDefinition } from '../abstract-command';
import { Message } from 'discord.js';
import { FCBot } from '../FCBot';
import { Color } from '../utils/color';
import { NovelCovid } from 'novelcovid';

const commandLineArgs = require("command-line-args");
const HRNumbers = require('human-readable-numbers');

let novelCovid = new NovelCovid();

export class Covid extends AbstractCommand {

    protected prefix = 'covid';
    protected optionsDefinition: OptionDefinition[] = [
        {
            name: 'country',
            type: String,
            alias: 'c',
            description: 'Kraj',
            typeLabel: '__country__',
            defaultOption: true,
        },
        {
            name: 'help',
            type: Boolean,
            alias: 'h',
            description: 'Pomoc'
        }
    ];
    protected usageDefinition: UsageDefinition[] = [
        {
            header: 'x',
            description: "Pokazuje statystyki COVID."
        },
        {
            header: "Opcje",
            optionList: this.optionsDefinition
        }
    ];

    constructor(message: Message) {
        super(message);
        this.parseOptions();
    }

    //todo rozbić na dwie jeśli są tylko parametry lub jest subkomnedda i przenieść do abstract
    private parseOptions() {
        console.log('parseOptions:');
        let messageContent = this.message.content.trim();
        let usedPrefix = messageContent.split(' ')[0];
        let forPrase = messageContent.replace(`${usedPrefix}`, '').trim();
        console.log(' forParse: ', forPrase);
        let argv = forPrase.split(' ');
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

    execute(): void {
        console.log('execute:');
        console.log(' this.options.help', this.options.help);
        if (this.options.help) {
            this.showUsage();
            return;
        }

        if (this.options.country && this.options.country.length > 0) {
            this.country(this.options.country);
        } else {
            this.all();
        }

    }

    all() {
        novelCovid.all()
            .then((data: any) => {
                console.log(data);
                this.sendEmbedAll(data);
            })
            .catch((err: any) => {
                console.error(err);
                this.error(JSON.stringify(err));
            });
    }

    country(country: string) {
        novelCovid.countries(country)
            .then((data: any) => {
                console.log(data);
                this.sendEmbed(data);
            })
            .catch((err: any) => {
                console.error(err);
                this.error(JSON.stringify(err));
            });

    }

    sendEmbedAll(data: any) {
        const date = new Date(data.updated);
        const stringDate = date.toISOString();
        let cases = data.cases +'';
        let deaths = data.deaths +'';
        let recovered = data.recovered +'';

        let description =
            `:zombie: \`${cases.padStart(10)}\`\n` +
            `:skull: \`${deaths.padStart(10)}\`\n` +
            `:heart: \`${recovered.padStart(10)}\`\n` +
            `${stringDate}`;
        const embed = FCBot.embed()
            .setColor(Color.DARK_RED)
            .setTitle('Globalne dane')
            .setDescription(description)
        ;
        this.message.channel.send(embed);

    }
    sendEmbed(data: any) {
        const date = new Date(data.updated);
        let cases = data.cases +'';
        let deaths = data.deaths +'';
        let recovered = data.recovered +'';
        let todayCases = data.todayCases + '';
        let todayDeaths = data.todayDeaths +'';
        let active = data.active +'';
        let critical = data.critical +'';
        let total =
            `:zombie: \`${cases.padStart(7)}\`\n` +
            `:skull: \`${deaths.padStart(7)}\`\n` +
            `:heart: \`${recovered.padStart(7)}\`\n`;
        let today =
            `:zombie: \`${todayCases.padStart(7)}\`\n` +
            `:skull: \`${todayDeaths.padStart(7)}\`\n`;
        let current =
            `:zombie: \`${active.padStart(7)}\`\n` +
            `:hospital: \`${critical.padStart(7)}\`\n`;


        const embed = FCBot.embed()
            .setColor(Color.DARK_RED)
            .setTitle(`Dane dla kraju **${data.country}**`)
            .addField('Ogólnie', total)
            .addField('W dniu dzisiejszym', today)
            .addField('Stan na dziś', current)
        ;
        this.message.channel.send(embed);

    }
}
