import {AbstractCommand, OptionDefinition, UsageDefinition} from "../abstract-command";
import {Connection, createConnection, MysqlError} from "mysql";
import {Message} from "discord.js";
import {Interface} from "readline";
import {FCBot} from "../FCBot";
import {values} from "node-persist";
import {Db} from "../db";
import {EmbedUtils} from "../utils/embed-utils";

const commandLineArgs = require("command-line-args");

enum ValidActions {
    LIST = 'list',
    ADD = 'add',
    REMOVE = 'remove'
}


export class Officer extends AbstractCommand {

    protected prefix = 'officer';

    protected optionsDefinition: OptionDefinition[] = [
        {
            name: 'action',
            type: String,
            alias: 'a',
            description: 'Valid actions: ' + (Object.values(ValidActions).filter(value => typeof value === 'string') as string[]).map((val) => `${val}`).join(', '),
            typeLabel: '__action__',
            defaultValue: ValidActions.LIST,
        },
        {
            name: 'name',
            type: String,
            alias: 'n',
            description: 'Officer name',
            typeLabel: '__officer__',
            multiple: true,
            defaultOption: true
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
            description: "XX"
        },
        {
            header: "Opcje",
            optionList: this.optionsDefinition
        }
    ];

    private db: Db;
    private officers: any[] = [];

    constructor(message: Message) {
        super(message);
        this.parseOptions();
        this.db = new Db();
    }

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
        console.log('execute');
        if (this.options.help) {
            this.showUsage();
            return;
        }

        if (!(Object.values(ValidActions).some((v) => v === this.options.action))) {
            this.error(`Action: **${this.options.action}** is invalid.\nValid actions are: ${(Object.values(ValidActions).filter(value => typeof value === 'string') as string[]).map((val) => `**${val}**`).join(', ')}`);
            return;
        }

        switch (this.options.action) {
            case ValidActions.LIST:
                this.list();
                return;
            case ValidActions.ADD:
                this.add(this.options.name);
                return;
            case ValidActions.REMOVE:
                this.remove(this.options.name);
                return;
        }
    }

    private async list() {
        let officers: OfficerDTO[] = await this.getOfficers();
        let embed = EmbedUtils.embed();
        let field = '';
        officers.forEach(officer => {
            field += `${officer.name}\n`
        });
        embed.addField('**Oficerowie**', field);

        this.message.channel.send(embed);
        console.log('officers', officers);
    }

    getOfficers(): Promise<OfficerDTO[]> {
        return this.db.asyncQuery("SELECT * FROM officer");
    }

    private add(names: string[]) {
        names.forEach(name => {
            this.db.conn.query("INSERT INTO officer SET name=?", name, (error, results, fields) => {
                if (error) {
                    this.error(error.message);
                    return;
                }
                console.log(results);
                this.message.channel.send(`Dodałem ${results.affectedRows} wpisów`);
            })
        })
    }

    private remove(names: string[]) {

    }
}

interface OfficerDTO {
    id: number,
    name: string,
}
