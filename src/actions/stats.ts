import { AbstractCommand, OptionDefinition, UsageDefinition } from '../abstract-command';
import { Message } from 'discord.js';
import { Connection, createConnection, MysqlError } from 'mysql';
import moment, { Moment } from 'moment';
import { FCBot } from '../FCBot';
import { Color } from '../utils/color';
import { changeEmptyToVal } from '../utils/util.functions';

const commandLineArgs = require("command-line-args");
const HRNumbers = require('human-readable-numbers');

export class Stats extends AbstractCommand {

    protected prefix = 'stats';
    protected optionsDefinition: OptionDefinition[] = [
        {
            name: 'type',
            type: String,
            alias: 't',
            description: 'Dostępny typy: guildgp, gp',
            typeLabel: '__typ__'
        },
        {
            name: 'nick',
            type: String,
            alias: 'n',
            defaultOption: true,
            description: 'Nick z gry, wymagany dla typu gp',
            typeLabel: '__nick__'
        },
        {
            name: 'period',
            type: String,
            alias: 'p',
            description: 'Okres z jakiego pokazać statystki. Dostępne i rozsądne: day, week, month, year',
            typeLabel: '__okres czasu__'
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
            description: "Pokazuje statystyki członkóœ gildii."
        },
        {
            header: "Opcje",
            optionList: this.optionsDefinition
        }
    ];

    protected readonly acceptedTypes = [
        'guildgp',
        'gp',
    ];

    protected mysqlConn: Connection;

    setUpMySQLConnection() {

        this.mysqlConn.connect((err) => {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            console.log('connected as id ', this.mysqlConn.threadId);
        });

        this.mysqlConn.on("close", (err) => {
            console.log(`SQL CONNECTION CLOSED: ${err}`);
        });

    }

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

        this.setUpMySQLConnection();
        this.handleDisconnect();
        this.parseOptions();
    }

    handleDisconnect() {
        this.mysqlConn.on('error', (err) => {
            console.log('Re-connecting lost connection');
            this.mysqlConn.destroy();
            this.setUpMySQLConnection();
            this.handleDisconnect();
        });
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

        if (options.command) {
            this.subcommand = options.command;

            let subcommandDefinition: any[] = [];
            //todo przystosować do abstract
            // switch(this.subcommand) {
                // case 'add':
                //     subcommandDefinition = this.commandOptionsDefinition['add'];
                //     break;
                // case 'del':
                //     subcommandDefinition = this.commandOptionsDefinition['del'];
                //     break;
                // case 'set':
                //     subcommandDefinition = this.commandOptionsDefinition['set'];
                //     break;
                // default:
                //todo wymusić help
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

        if (this.acceptedTypes.indexOf(this.options.type) < 0) {
            this.showUsage();
            return;
        }

        switch (this.options.type) {
            case 'gp':
                this.gpStats();
                break;
            case 'guildgp':
                this.guildStats();
        }

    }

    gpStats() {
        let query = `SELECT DISTINCT galactic_power, character_galactic_power, ship_galactic_power, last_updated FROM player_data where name = ? order by last_updated desc;`;
        this.mysqlConn.query(query, [this.options.nick], (err, result: any[], fields) => {
            if (err) {
                this.error(err.message);
                return;
            }
            let message = 'date GP chGP, sGP\n';

            result.forEach((row) => {
                let dateFrom = moment(row.last_updated);
                message += `${dateFrom.format('YYYY-MM-DD hh:mm:ss')} ${row.galactic_power} ${row.character_galactic_power} ${row.ship_galactic_power}\n`;
            });
            console.log(result);

            const embed = FCBot.embed()
                .setColor(Color.BLUE)
                .setDescription(`\`\`\`${message}\`\`\``)
            ;
            this.message.channel.send(embed);
        })
    }

    guildStats() {
        //najwyższe gp
        this.getMaxGP(3);
        //najszybszy rozwój --ostatni tydzień, miesiąc rok
        //Najwolniejszy rozwój
        //najniższe GP
    }
    getMaxGP(count: number) {

        let queryMax = `SELECT name, galactic_power, character_galactic_power, ship_galactic_power, MAX (last_updated) FROM \`do-api\`.player_data group by ally_code order by galactic_power desc limit ?`;

        let queryMin = `SELECT name, galactic_power, character_galactic_power, ship_galactic_power, MAX (last_updated) FROM \`do-api\`.player_data group by ally_code order by galactic_power asc limit ?`;

        let gpProgreess = 'select t1.name, min_gp, max_gp,  (max_gp-min_gp)/min_gp*100 as progress ' +
            'from ' +
            '(select ' +
            'ANY_VALUE(name) as name, ally_code, min(galactic_power) as min_gp ' +
            'from player_data ' +
            'where last_updated > ? ' +
            'group by ally_code) as t1 ' +
            'JOIN ' +
            '(select ' +
            'ANY_VALUE(name) as name, ally_code, max(galactic_power) as max_gp ' +
            'from player_data ' +
            'where last_updated > ? ' +
            'group by ally_code) as t2 ' +
            'on t1.ally_code = t2.ally_code ' +
            '';
        let gpProgressMax = gpProgreess + ' order by progress desc limit ?';
        let gpProgressMin = gpProgreess + ' order by progress asc limit ?';
        console.log(gpProgressMin);
        let results: any = {
            min: [],
            max: [],
            progressMin: [],
            progressMax: [],
        };
        //todo sprawdzić datę
        let d = moment();
        d.subtract('1', this.options.period);
        console.log('date', d);
        let dateString = d.format('YYYY-MM-DD hh:mm:ss');
        this.mysqlConn.query(`${queryMax}; ${queryMin}; ${gpProgressMax}; ${gpProgressMin}`, [count, count, dateString, dateString, count, dateString, dateString, count])
            .on('result', (result, index) => {
                console.log(' multiple results: ', index, result);
                switch (index) {
                    case 0:
                        results.max.push(result);
                        break;
                    case 1:
                        results.min.push(result);
                        break;
                    case 2:
                        results.progressMax.push(result);
                        break;
                    case 3:
                        results.progressMin.push(result);
                        break;
                }
            })
            .on('error', (err: MysqlError) => {
                this.error(err.message);
            })
            .on('end', () => {
                let maxGpValue = '';
                results.max.forEach((val:any) => {
                    maxGpValue += `**${val.name}** - ${HRNumbers.toHumanString(val.galactic_power)}\n`
                });
                let minGpValue = '';
                results.min.forEach((val: any) => {
                    minGpValue += `**${val.name}** - ${HRNumbers.toHumanString(val.galactic_power)}\n`
                });
                let maxGpProgress = '';
                results.progressMax.forEach((val:any) => {
                    maxGpProgress += `**${val.name}** - ${Math.round((val.progress + Number.EPSILON) * 100) / 100}\n`
                });
                let minGpProgress = '';
                results.progressMin.forEach((val:any) => {
                    minGpProgress += `**${val.name}** - ${Math.round((val.progress + Number.EPSILON) * 100) /100}\n`
                });
                maxGpValue = changeEmptyToVal(maxGpValue, 'Brak danych');
                minGpValue = changeEmptyToVal(minGpValue, 'Brak danych');
                maxGpProgress = changeEmptyToVal(maxGpProgress, 'Brak danych');
                minGpProgress = changeEmptyToVal(minGpProgress, 'Brak danych');
                const embed = FCBot.embed()
                    .setColor(Color.BLUE)
                    .addField('**Najwyższe GP**', `${maxGpValue}`, true)
                    .addField('**Najniższe GP**', `${minGpValue}`, true)
                    .addBlankField()
                    .addField('**Najwyższy przyrost GP**', `${maxGpProgress}`, true)
                    .addField('**Najniższy przyrost GP**', `${minGpProgress}`, true)
                ;
                this.message.channel.send(embed);
            })
        ;
    }
}
