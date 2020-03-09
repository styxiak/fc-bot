import { AbstractCommand, OptionDefinition, UsageDefinition } from '../abstract-command';
import { Message, RichEmbed } from 'discord.js';
import { Connection, createConnection, MysqlError } from 'mysql';
import { FCBot } from '../FCBot';
import moment from 'moment';
const table = require('text-table');

const commandLineArgs = require("command-line-args");

interface CommandOptionsDefinition {
    add: OptionDefinition[],
    list: OptionDefinition[],
    del: OptionDefinition[],
    clear: OptionDefinition[],
}

export class Abs extends AbstractCommand {


    protected prefix = 'abs';
    protected readonly acceptedCommands = [
        'add',
        'del',
        'list',
        'clear',
    ];
    protected optionsDefinition: OptionDefinition[] = [
        {
            name: 'command',
            type: String,
            defaultOption: true,
            description: 'Dostępne komendy: list, add, del, clear'
        },

        {
            name: 'help',
            type: Boolean,
            alias: 'h',
        },
    ];
    protected commandOptionsDefinition: CommandOptionsDefinition = {
        add : [
            {
                name: 'name',
                type: String,
                alias: 'n',
                description: 'Nick nieobecnego. Jeśli się pominie, to doda zgłaszajacego',
                typeLabel: '__name__'
            },
            {
                name: 'from',
                type: String,
                alias: 'f',
                description: 'Od kiedy. Format: YYYY-MM-DD',
                typeLabel: '__od__'
            },
            {
                name: 'to',
                type: String,
                alias: 't',
                description: 'Do kiedy. Format: YYYY-MM-DD',
                typeLabel: '__do__'
            },
        ],
        list: [
            {
                name: 'current',
                type: Boolean,
                alias: 'c',
                description: 'Pokaż nieobecności ważne teraz.'
            }
        ],
        del: [

        ],
        clear: [

        ]
    };
    protected usageDefinition: UsageDefinition[] = [
        {
            header: 'x',
            description: "Pozwala zarządzać nieobecnościami w gildii "
        },
        {
            header: "Lista komend",
            content:
                '`add     ` Dodaje nieobecność\n' +
                '`del     ` Usuwa nieobecność\n' +
                '`clear   ` Czyści wszystkie nieobecności\n' +
                '`list    ` Wyświetla nieobecności\n' +
                '' +
                ''
        },
        {
            header: 'Więcej informacji',
            content: 'Aby uzyskać więcej informacji wywołaj:\n' +
                '```!abs [komenda] -h```'
        }

    ];

    protected readonly commandUsageDefinition = {
        add: [
            {
                header: 'X',
                description: 'Dodaje nieobecność. Jeśli pominie się `--nick` to doda zgłaszającego.'
            },
            {
                header: 'Opcje',
                optionList: this.commandOptionsDefinition.add
            },
            {
                header: 'Przykład użycia',
                content: '`!abs add -f 2020-03-01 -t 2020-04-01 Wyjazd w Bieszczady` doda nieobecność w podanym terminie\n' +
                    '`!abs add -f 2020-05-01 Nie wiem kiedy wrócę` doda nieobecność bez ustalonej daty końcowej'
            }
        ],
        del: [],
        clear: [],
        list: [
            {
                header: 'X',
                description: 'Pkazuje listę zgłoszonych nieobecności'
            },
            {
                header: 'Opcje',
                optionList: this.commandOptionsDefinition.list
            },

        ],
    };

    protected mysqlConn: Connection;

    constructor(message: Message) {
        super(message);
        let connectionUri = {
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASS,
            database: process.env.MYSQL_DB,
            multipleStatements: true
        };
        this.mysqlConn = createConnection(connectionUri);

        this.mysqlConn.connect((err) => {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            console.log('connected as id ', this.mysqlConn.threadId);
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
        switch(this.subcommand) {
            case 'add':
                subcommandDefinition = this.commandOptionsDefinition['add'];
                break;
            case 'del':
                subcommandDefinition = this.commandOptionsDefinition['del'];
                break;
            case 'list':
                subcommandDefinition = this.commandOptionsDefinition['list'];
                break;
            default:
            //todo wymusić help
        }

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
        console.log('execute:');
        console.log(' this.options.help', this.options.help);
        if (this.options.help) {
            this.showUsage();
            return;
        }

        console.log(' subcommand', this.subcommand);
        if (this.acceptedCommands.indexOf(this.subcommand) < 0) {
            this.showUsage();
            return;
        }

        switch (this.subcommand) {
            case 'add':
                this.add();
                break;
            case 'list':
                if (this.options.current) {
                    this.list(true);
                } else  {
                    this.list();
                }
                break;
        }
    }

    add() {
        let nick = this.message.member.user.username;
        //todo opgraniczyć do roli - przenieść sprawdzanie roli z mentions do FCBOT
        if (this.options.nick) {
            nick = this.options.nick;
        }
        let from = moment(this.options.from);
        let to = moment(this.options.to);
        let reason = this.options._unknown.join(' ');
        const embed = FCBot.embed();

        embed.addField('x', `dodaję: \`${nick}\` \`${from.format()}\` \`${to.format()}\` \`${reason}\``);
        this.message.channel.send(embed);

        let query = 'INSERT INTO absences (`name`, `from`, `to`, `reason`, `creator`) values (?,?,?,?,?)';
        this.mysqlConn.query(query, [nick, from.format(), to.format(), reason, this.message.member.user.username])
            .on ('result', (result) => {
                console.log(result);
            })
            .on('error', (err: MysqlError) => {
                this.error(err.message);
            })
    }

    list(current: boolean = false) {
        let query = 'SELECT * FROM absences';
        if (current) {
            query = 'SELECT * FROM absences where (`from` <= now() OR `from` IS NULL) AND (`to` >= NOW() OR `to` IS NULL)';
        }
        let messageData = [['**Nick**', '**Od**', '**Do**', '**Powód**']];

        this.mysqlConn.query(query)
            .on('result', (abs: any) => {
                console.log(abs);
                let row = [
                    abs.name,
                    moment(abs.from).format('YYYY-MM-DD'),
                    moment(abs.to).format('YYYY-MM-DD'),
                    abs.reason
                ];
                messageData.push(row);
            })
            .on('error', (err: MysqlError) => {
                this.error(err.message);
            })
            .on('end', () => {
                const embed = FCBot.embed();
                let message = table(messageData);
                embed.setDescription(`\`\`\`${message}\`\`\``);
                this.message.channel.send(embed);

            });
    }

    protected prepareUsage(): RichEmbed {
        switch(this.subcommand) {
            case 'add':
                this.usageDefinition = this.commandUsageDefinition.add;
                break;
            case 'del':
                this.usageDefinition = this.commandUsageDefinition.del;
                break;
            case 'list':
                this.usageDefinition = this.commandUsageDefinition.list;
                break;
            case 'clear':
                this.usageDefinition = this.commandUsageDefinition.clear;
                break;
        }
        return super.prepareUsage();
    }
}
