import { AbstractCommand, OptionDefinition, UsageDefinition } from '../abstract-command';
import { Message } from 'discord.js';
import { Connection, createConnection } from 'mysql';

const commandLineArgs = require("command-line-args");


export class Abs extends AbstractCommand {

    protected prefix = 'abs';
    protected optionsDefinition: OptionDefinition[] = [

    ];
    protected usageDefinition: UsageDefinition[] = [

    ];

    protected mysqlConn: Connection;

    constructor(message: Message) {
        super(message);
        this.mysqlConn = createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASS
        });

        this.parseOptions();
    }
    //todo rozbić na dwie jeśli są tylko parametry lub jest subkomnedda i przenieść do abstract
    private parseOptions() {
        console.log('parseOptions:');
        let messageContent = this.message.content.trim();
        let usedPrefix = messageContent.split(' ')[0];
        if (messageContent === `${usedPrefix}`) {
            messageContent += ' -h';
        }
        let forPrase = messageContent.replace(`${usedPrefix}`, '').trim();
        console.log(' forParse: ', forPrase);
        let argv = forPrase.split(' ');
        let regex = new RegExp(`/!${this.prefix}(.*)-- /`);
        this.textMessage = messageContent.replace(regex, '').trim();

        let options = commandLineArgs(
            this.optionsDefinition, {
                argv: argv,
                partial: true,
                stopAtFirstUnknown: true,
                camelCase: true
            });
        this.options = options;
        argv = options._unknown || [];
        console.log(' options', options);

        this.subcommand = options.command;

        let subcommandDefinition: any[] = [];
        // switch(this.subcommand) {
        //     case 'add':
        //         subcommandDefinition = this.commandOptionsDefinition['add'];
        //         break;
        //     case 'del':
        //         subcommandDefinition = this.commandOptionsDefinition['del'];
        //         break;
        //     case 'set':
        //         subcommandDefinition = this.commandOptionsDefinition['set'];
        //         break;
        //     default:
        //     //todo wymusić help
        // }

        this.options = commandLineArgs(
            subcommandDefinition, {
                argv: argv,
                partial: true,
                stopAtFirstUnknown: true,
                camelCase: true
            });
        if (options.help) {
            this.options.help = options.help;
        }
        console.log(' this.options', this.options);
        console.log(' this.textMessage', this.textMessage);
    }

    execute(): void {

    }

}
