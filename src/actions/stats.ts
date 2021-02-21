import {AbstractCommand, OptionDefinition, UsageDefinition} from '../abstract-command';
import {Message} from 'discord.js';
import moment from 'moment';
import {Color} from '../utils/color';
import {changeEmptyToVal} from '../utils/util.functions';
import {Db} from "../db";
import {EmbedUtils} from "../utils/embed-utils";

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
            name: 'count',
            type: Number,
            alias: 'c',
            description: 'Ile ludzi pokazać, domyślnie 3',
            typeLabel: '__ilość__'
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
            description: "Pokazuje statystyki członków gildii."
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

    protected db: Db;

    constructor(message: Message) {
        super(message);

        this.db = new Db();
        this.parseOptions();
        this.setDefaultOptions();
    }

    execute(): void {
        if (this.cantBeExecuted()) {
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

    private setDefaultOptions() {
        if (!this.options.count) {
            this.options.count = 3;
        }
    }

    private cantBeExecuted(): boolean {
        if (this.options.help) {
            this.showUsage();
            return false;
        }

        if (this.acceptedTypes.indexOf(this.options.type) < 0) {
            this.showUsage();
            return false;
        }

        return true;
    }

    gpStats() {
        let query = `SELECT DISTINCT galactic_power, character_galactic_power, ship_galactic_power, last_updated FROM player_data where name = ? order by last_updated desc;`;
        this.db.conn.query(query, [this.options.nick], (err, result: any[], fields) => {
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

            const embed = EmbedUtils.embed()
                .setColor(Color.BLUE)
                .setDescription(`\`\`\`${message}\`\`\``)
            ;
            this.message.channel.send(embed);
        })
    }

    guildStats() {
        this.getMaxGP(this.options.count);
    }

    async getMaxGP(count: number) {

        let query = `SELECT ANY_VALUE(name) as name, ANY_VALUE(galactic_power) as galactic_power, ANY_VALUE(character_galactic_power) as character_galactic_power, ANY_VALUE(ship_galactic_power) as ship_galactic_power, MAX(last_updated) FROM \`do-api\`.player_data group by ally_code`;
        let queryMax = query + ' order by galactic_power desc limit ?'
        let queryMin = query + ' order by galactic_power asc limit ?'

        let guildAverageProgressQuery = 'select (max_gp-min_gp) /50 as average from (select min(galactic_power) as min_gp, ANY_VALUE(id)  as id FROM guild_data where last_update > ?) as t1 JOIN (select max(galactic_power) as max_gp, ANY_VALUE(id)  as id FROM guild_data where last_update > ?) as t2 ON t1.id = t2.id;\n';

        let gpProgress = 'select distinct\n' +
            '   p.name,\n' +
            '   min_gp,\n' +
            '   max_gp,\n' +
            '   (max_gp-min_gp)/? * 100 as progress\n' +
            'from player_data as p\n' +
            'JOIN (\n' +
            'select ally_code, min(galactic_power) as min_gp \n' +
            ' from player_data where last_updated > ? group by ally_code\n' +
            ') as t1 on t1.ally_code = p.ally_code\n' +
            'JOIN (\n' +
            'select ally_code, max(galactic_power) as max_gp \n' +
            ' from player_data where last_updated > ? group by ally_code\n' +
            ') as t2 on t2.ally_code = p.ally_code' +
            '';
        let gpProgressMax = gpProgress + ' order by progress desc limit ?';
        let gpProgressMin = gpProgress + ' order by progress asc limit ?';
        let results: any = {
            min: [],
            max: [],
            progressMin: [],
            progressMax: [],
        };
        //todo sprawdzić datę
        let d = moment();
        d.subtract('1', this.options.period);
        let dateString = d.format('YYYY-MM-DD hh:mm:ss');

        let guildAverage = await this.db.asyncQuery(guildAverageProgressQuery, [dateString, dateString]);
        let average = guildAverage[0].average;
        console.log(average);

        results.max = await this.db.asyncQuery(queryMax, [count]);
        results.min = await this.db.asyncQuery(queryMin, [count]);
        results.progressMax = await this.db.asyncQuery(gpProgressMax, [average, dateString, dateString, count]);
        results.progressMin = await this.db.asyncQuery(gpProgressMin, [average, dateString, dateString, count]);
        console.log(results.progressMin);
        this.sendData(results);

        return;
    }

    sendData(results: any) {
        console.log('SENDING');
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
            maxGpProgress += `**${val.name}** - ${Math.round((val.progress + Number.EPSILON) * 100) / 100}%\n`
        });
        let minGpProgress = '';
        results.progressMin.forEach((val:any) => {
            minGpProgress += `**${val.name}** - ${Math.round((val.progress + Number.EPSILON) * 100) /100}%\n`
        });
        maxGpValue = changeEmptyToVal(maxGpValue, 'Brak danych');
        minGpValue = changeEmptyToVal(minGpValue, 'Brak danych');
        maxGpProgress = changeEmptyToVal(maxGpProgress, 'Brak danych');
        minGpProgress = changeEmptyToVal(minGpProgress, 'Brak danych');
        const embed = EmbedUtils.embed()
            .setColor(Color.BLUE)
            .addField('**Najwyższe GP**', `${maxGpValue}`, true)
            .addField('**Najniższe GP**', `${minGpValue}`, true)
            .addField('\u200b', '\u200b')
            .addField('**Najwyższy przyrost GP**', `${maxGpProgress}`, true)
            .addField('**Najniższy przyrost GP**', `${minGpProgress}`, true)
        ;
        this.message.channel.send(embed);
    }

}
