import {AbstractCommand, OptionDefinition, SubOptionDefinition, UsageDefinition} from "../abstract-command";
import {Message, MessageReaction} from "discord.js";
import {Db} from "../db";
import {UserUtils} from "../utils/user-utils";
import {CHANNEL_CPIT_1, CHANNEL_CPIT_2, CHANNEL_CPIT_3, CHANNEL_CPIT_4, CHANNEL_TEST} from "../types/channel";
import {EmbedUtils} from "../utils/embed-utils";

import {getBorderCharacters, table} from 'table';
import {numberToLength} from "../utils/util.functions";

export class Cpit extends AbstractCommand {

    protected prefix = 'cpit';
    protected readonly optionsDefinition: OptionDefinition[] = [
        {
            name: 'damage',
            type: Number,
            defaultOption: true,
        },
        {
            name: 'help',
            alias: 'h',
            type: Boolean,
            description: 'Pomoc'
        },
    ];

    protected readonly commandOptionsDefinition: SubOptionDefinition = {
        add: [
            {
                name: 'content',
                type: String,
                defaultOption: true,
                description: 'XXX',
                typeLabel: '__rola__'
            }
        ],

    };
    protected usageDefinition: UsageDefinition[] = [
        {
            header: 'This will not be shown',
            description: 'Bla bla bla'
        },
        {
            header: 'Lista komend',
            content:
                // '`config ` Pokazuje aktualną konfigurację\n' +
                // '`add    ` Dodaje nową wzmiankę do listy\n' +
                // '`del    ` Usuwa wzmiankę z listy\n' +
                // '`check  ` Sprawdza nasz status\n' +
                // '`clear  ` Usuwa rolę jeśli to możliwe\n' +
                '`add    ` Dodaje % do fazy\n'
        },
        {
            header: 'Więcej informacji',
            content: 'Aby uzyskać więcej informacji wywołaj:\n' +
                '```!m [komenda] -h```'
        }
    ];

    protected readonly commandUsageDefinition = {
        add: [
            {
                header: 'X',
                description: 'Dodaje ilość % do fazy.'
            },
            {
                header: 'Opcje',
                optionList: this.commandOptionsDefinition.add
            },
            {
                header: 'Przykład użycia',
                content: '`!mention add guild` doda wzmiankę @guild'
            }
        ],

    }
    private allowedChannels: string[] = [
        CHANNEL_CPIT_1,
        CHANNEL_CPIT_2,
        CHANNEL_CPIT_3,
        CHANNEL_CPIT_4,
        CHANNEL_TEST,
    ];

    private db: Db;

    constructor(message: Message) {
        super(message);
        this.parseOptions(message.content.replace(',', '.').replace('%', '').trim());

        this.db = new Db();
    }

    execute() {
        if (this.options.help) {
            this.showUsage();

            return;
        }
        let find = this.allowedChannels.find(channelId => channelId === this.message.channel.id);
        console.log(find);
        if (undefined === find) {
            this.replyError('Tej komndy mozna używać tylko na kanałach rajdu');
            return;
        }
        switch(this.command) {
            case 'a':
            case 'add':
                this.addDamage();
                break;
            case 'del':
                this.delete();
                break;
            case 'cpit':
                switch(this.subcommand) {
                    case'clear':
                        this.clear();
                    break;
                    case 'del':
                        this.delete();
                        break;
                    default:
                        this.list()
                }
                break;
            default:
                this.list();
            break;
        }
    }

    protected addDamage() {
        let damage = this.options.damage;
        if (damage > 100 || damage <= 0 || isNaN(damage)) {
            this.replyError('Uszkodzenia muszą się mieścić w przedziale 0-100');
            return;
        }
        let userName = this.getUserName();
        let phase = this.getPhaseFromChannel();
        let team = this.getTeam();
        let message = `User: ${userName}, Damage: ${damage}, Phase: ${phase}, Team: ${team}`;
        console.log(message);
        //!a 3.12 team
        //!a 3.12 team @user
        let record: RancorRow = {
            phase: phase,
            user: userName,
            team: team,
            damage: damage,
        };
        this.db
            .asyncQuery('INSERT INTO rancor set ?', record)
            .then(result => {
                this.replaySuccess();
                //todo pomyśłeć o reakcji w catch/global error handler
            });
    }

    protected list() {
        let phase = this.getPhaseFromChannel();
        const config = {
            singleLine: true,
            border: getBorderCharacters(`void`),
            drawHorizontalLine: () => {
                return false
            }
        };
        this.db.asyncQuery('SELECT * FROM rancor WHERE phase = ?', [phase])
            .then(result => {
                console.log(result);

                let data: any[] = [];
                data.push(['ID', 'USER', '%', 'TEAM']);

                let sum = 0;
                result.forEach((row: RancorRow) => {
                    sum += row.damage;
                    let stringDamage = numberToLength(row.damage.toString());
                    data.push([row.id, row.user, stringDamage,  row.team]);
                });

                let tableData = table(data, config);
                let message = `\`\`\`${tableData}\nSuma: ${sum.toFixed(2)}\`\`\``;
                const embed = EmbedUtils.embed()
                    .setThumbnail('')
                    .setTitle(`Wyniki w fazie **${phase}**`)
                    .setDescription(message)
                ;
                this.message.channel.send(embed);
                this.replaySuccess();
            });

    }

    protected clear() {
        let phase = this.getPhaseFromChannel();
        this.message.react('👍').then(() => this.message.react('👎'));
        const filter = (reaction:any, user:any) => {
            return ['👍', '👎'].includes(reaction.emoji.name) && user.id === this.message.author.id;
        };

        this.message.awaitReactions(filter, { max: 1, time: 10000, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();
                if ((reaction as MessageReaction).emoji.name === '👍') {
                    this.db.asyncQuery('DELETE FROM rancor WHERE phase = ?', [phase])
                        .then(() => {
                            this.replaySuccess(`Tabela dla fazy **${phase}** została wyczyszczona`);
                        })
                    ;

                } else {
                    this.replyError();
                }
            })
            .catch(collected => {
                this.replyError('Upłynał czas na potwierdzenie');
            });
    }

    private delete() {
        let id: any;
        if (!isNaN(this.options.damage)) {
            id = this.options.damage;
            if (id == 0) {
                this.replyError('Musisz podać id rekordu do usunięcia');
                return;
            }
        } else {
            //subcommand
            if (!this.options._unknown) {
                this.replyError('Musisz podać id rekordu do usunięcia');
                return;
            }
            id = this.options._unknown[0];
        }
        this.message.react('👍').then(() => this.message.react('👎'));
        const filter = (reaction:any, user:any) => {
            return ['👍', '👎'].includes(reaction.emoji.name) && user.id === this.message.author.id;
        };

        this.message.awaitReactions(filter, { max: 1, time: 10000, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();
                if ((reaction as MessageReaction).emoji.name === '👍') {
                    this.db.asyncQuery('DELETE FROM rancor WHERE id = ?', [id])
                        .then((result) => {
                            if (result.affectedRows == 0) {
                                this.replyError(`Nie znalazłem rekordu o id **${id}**`);
                                return;
                            }
                            this.replaySuccess(`Rekord o id **${id}** został usunięty`);
                        })
                    ;

                } else {
                    this.replyError();
                }
            })
            .catch(collected => {
                this.replyError('Upłynał czas na potwierdzenie');
            });

    }

    protected getPhaseFromChannel() {
        switch (this.message.channel.id) {
            case CHANNEL_CPIT_1:
                return 1;
            case CHANNEL_CPIT_2:
                return 2;
            case CHANNEL_CPIT_3:
                return 3;
            case CHANNEL_CPIT_4:
                return 4;
        }

        return 5;
    }

    protected getUserName() {
        let founded = null;
        if (!this.options._unknown) {
            return UserUtils.getNormalizedNick(this.message.member);
        }

        this.options._unknown.forEach((value: string) => {
            let user = UserUtils.getUserFromMention(value);
            if (user) {
                founded = UserUtils.getNormalizedNick(user);
            }
        });

        if (founded) {
            return founded;
        }

        return UserUtils.getNormalizedNick(this.message.member);
    }

    protected getTeam() {
        let founded = null;
        if (!this.options._unknown) {
            return '';
        }
        this.options._unknown.forEach((value: string) => {
            let user = UserUtils.getUserFromMention(value);
            if (!user) {
                founded = value;
            }
        });

        return founded ?? '';
    }

}

interface RancorRow {
    id?: number,
    phase: number,
    damage: number,
    team: string,
    user: string,
}
