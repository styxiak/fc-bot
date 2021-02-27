import {GuildMember, Message, MessageEmbed, Role} from "discord.js";
import storage from 'node-persist';
import NodePersist from 'node-persist';
import moment, { Moment } from 'moment';
import {AbstractCommand, OptionDefinition, SubOptionDefinition, UsageDefinition} from '../abstract-command';

const commandLineArgs = require("command-line-args");

interface Config {
    mentions: string[];
    deniedRole: string;
    deniedHowLong: number;
    howMany: number;
    howLong: number;
}

interface UserMention {
    time: Date;
}

interface UserMentions  {
    [key: string]: UserMention[];
}

const defaultConfig: Config = {
    mentions:
        ["@test"],
    deniedRole: '',
    deniedHowLong: 7,
    howMany: 3,
    howLong: 5,
};

export class Mention extends AbstractCommand {

    protected readonly prefix = 'mention';
    protected readonly acceptedCommands = [
        'set',
        'add',
        'del',
        'check',
        'clear',
        'config'
    ];
    protected readonly optionsDefinition: OptionDefinition[] = [
        {
            name: 'command',
            type: String,
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
                name: 'mention',
                type: String,
                defaultOption: true,
                description: 'Nazwa wzmianki bez @',
                typeLabel: '__rola__'
            }
        ],
        del: [
            {
                name: 'mention',
                type: String,
                defaultOption: true,
                description: 'Nazwa wzmianki bez @',
                typeLabel: '__rola__'
            }
        ],
        set: [
            {
                name: 'deniedRole',
                alias: 'r',
                type: String,
                description: 'Nazwa roli, która zostanie przydzielona użytkownikowi, po przekroczeniu dozwolonej ilości wzmianek',
                typeLabel: '__rola__'
            },
            {
                name: 'howLong',
                type: Number,
                description: 'Okres czasu w jakim są zliczane wzmianki',
                typeLabel: '__minuty__'

            },
            {
                name: 'howMany',
                type: Number,
                description: 'Ilość dozwolonych wzmianek w okresie czasu',
                typeLabel: '__howMany__'

            },
            {
                name: 'deniedHowLong',
                type: Number,
                description: 'Długość kwarantanny',
                typeLabel: '__minutes__'

            },
        ]
    };
    protected usageDefinition: UsageDefinition[] = [
        {
            header: 'This will not be shown',
            description: 'Jeśli ktoś za dużo spamuje ~~@~~guild, to mogę Ci pomóc. Tą komendą można zdefiniować parametry kiedy nadać odpowiednią rolę użytkownikowi'
        },
        {
            header: 'Lista komend',
            content:
                '`config ` Pokazuje aktualną konfigurację\n' +
                '`add    ` Dodaje nową wzmiankę do listy\n' +
                '`del    ` Usuwa wzmiankę z listy\n' +
                '`check  ` Sprawdza nasz status\n' +
                '`clear  ` Usuwa rolę jeśli to możliwe\n' +
                '`set    ` Ustawia prametr[y] konfiguracyjne\n'
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
                description: 'Dodaje wzmiankę na jaką mam reagować. Wzmiankę wpisujemy bez @ na początku.'
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
        del: [
            {
                header: 'X',
                description: 'Usuwa wzmiankę z listy. Wzmiankę wpisujemy bez @ na początku.'
            },
            {
                header: 'Opcje',
                optionList: this.commandOptionsDefinition.del
            },
            {
                header: 'Przykład użycia',
                content: '`!mention del guild` usunie wzmiankę @guild'
            }
        ],
        set: [
            {
                header: 'X',
                description: 'Opis set'
            },
            {
                header: 'Opcje',
                optionList: this.commandOptionsDefinition.set
            },
            {
                header: 'Przykład użycia',
                content: '`!mention set --role [no-mentions] --howMany 32` Ustawi rolę na `[no-mentions]` i ilość dozwolonych wzmianek na `3`'
            }
        ],
        check: [
            {
                header: 'X',
                description: 'Sprawdzi Twój status'
            },

        ],
        clear: [
            {
                header: 'X',
                description: 'Jeśli to możliwe to wyczyści informacje o przeterminowanych wzmiankach oraz usunie rolę'
            }
        ],
        config: [
            {
                header: 'X',
                description: 'Wyświetli obecną konfigurację'
            }
        ]

    };
    private adminRoleName = 'FC Bot Admin';

    config$: Promise<Config>;
    mentions$: Promise<UserMentions>;
    // config: Config;

    private storage: NodePersist.LocalStorage;
    private configKey: string = 'mentionsConfig';
    private mentionsKey: string = 'usersMentions';

    constructor(message: Message) {
        super(message);
        this.storage = storage.create();
        let initStorage$ = this
            .storage
            .init({
                logging: true,
                dir: process.cwd() + '/../data/storage',
            });
        this.config$ = initStorage$
            .then((val) => {
                return this.storage.keys();
            })
            .then((keys) => {
                if (keys.indexOf(this.configKey) < 0) {
                    return this.saveConfig(defaultConfig);
                }
                return this.storage.getItem(this.configKey);
            })
            .catch((reason) => {
                console.error(`Error initializing config: ${reason}`);
            });
        this.config$
            .then((config:Config) => {
            })
            .catch((reason) => {
                console.error(`Error initializing config: ${reason}`);
            });

        this.mentions$ = initStorage$
            .then((val) => {
                return this.storage.keys();
            })
            .then((keys) => {
                if (keys.indexOf(this.mentionsKey) < 0) {
                    let mentions = new class implements UserMentions {
                        [key: string]: UserMention[];
                    };
                    return this.saveUserMentions(mentions);

                }
                return this.storage.getItem(this.mentionsKey);
            })
            .catch((reason) => {
                console.error(`Error initializing mentions: ${reason}`);
            });
        this.mentions$
            .then((mentions:UserMentions) => {
            })
            .catch((reason) => {
                console.error(`Error initializing mentions: ${reason}`);
            });
        this.parseOptions();
    }

    //todo rozbić na dwie jeśli są tylko parametry lub jest subkomnedda i przenieść do abstract
    protected parseOptions() {
        let messageContent = this.message.content.trim();
        let usedPrefix = messageContent.split(' ')[0];
        if (messageContent === `${usedPrefix}`) {
            messageContent += ' -h';
        }
        let forPrase = messageContent.replace(`${usedPrefix}`, '').trim();
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

        this.subcommand = options.command;

        let subcommandDefinition: OptionDefinition[];
        //todo check if index exist;
        subcommandDefinition = this.commandOptionsDefinition[this.subcommand];

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

    execute(): void {
        if (this.options.help) {
            this.showUsage();
            return;
        }
        //todo dodatkowe sprawdzanie kiedy pokazać help
        let member = this.message.member as GuildMember;

        // console.log(' subcommand', this.subcommand);
        if (this.acceptedCommands.indexOf(this.subcommand) < 0) {
            this.showUsage();
            return;
        }
        switch (this.subcommand) {
            case 'add':
                if (!this.isAdmin(member)) {
                    this.message.reply(`Aby użyc tej komendy musisz mieć rolę: ${this.adminRoleName}`);
                    break;
                }
                this.add(this.options.mention);
                break;
            case 'del':
                if (!this.isAdmin(member)) {
                    this.message.reply(`Aby użyc tej komendy musisz mieć rolę: ${this.adminRoleName}`);
                    break;
                }
                this.del(this.options.mention);
                break;
            case 'set':
                if (!this.isAdmin(member)) {
                    this.message.reply(`Aby użyc tej komendy musisz mieć rolę :${this.adminRoleName}`);
                    break;
                }
                this.setConfigOptions(this.options.deniedRole, this.options.howLong, this.options.howMany, this.options.deniedHowLong);
                break;
            case 'check':
                this.check();
                break;
            case 'clear':
                this.clear();
                break;
            case 'config':
                this.printConfig();
                break;

            default:
                this.message.reply("Komenda w trakcie implementacji");
        }
    }

    watch(): void {
        Promise.all([this.config$, this.mentions$])
            .then(([config, userMentions]) => {
                // console.log('readed from storage: config', config, 'mentions:', userMentions);
                // Can be null when not member post on channel like #data-mine
                if (null === this.message.member) {
                    return;
                }
                let member = this.message.member as GuildMember;
                // console.log(member);
                let userIndex: string = member.id;
                config.mentions.forEach((mention) => {
                    if (this.message.content.indexOf(mention) < 0) {
                        return;
                    }

                    let now = moment(this.message.createdAt);
                    // console.log('Mentions detected: ' + mention + ' by user: ' + member);
                    if (!userMentions[userIndex]) {
                        userMentions[userIndex] = [];
                    }
                    let userMention: UserMention = {
                        time: this.message.createdAt
                    };
                    let allowedAgo = now.subtract(config.howLong, 'minutes');
                    console.log(allowedAgo);
                    userMentions[userIndex].push(userMention);
                    this.saveUserMentions(userMentions)
                        .then((writeResult) => {

                        });
                    let counter = 0;
                    userMentions[userIndex].forEach((value) => {
                        let momentValue = moment(value.time);
                        // console.log(momentValue);
                        if (momentValue.isAfter(allowedAgo)) {
                            counter++;
                        }
                    });
                    // console.log(counter);
                    // console.log(userMentions);
                    if (config.howMany - 1 === counter) {
                        this.message.reply(`Jeszcze jedna wzmianka i zostaniesz uciszony.`);
                    }
                    if (config.howMany === counter) {
                        this.message.reply(`To był Twój ostatni raz!`);
                    }
                    if (config.howMany < counter) {
                        let message = `Dostajesz rolę \`${config.deniedRole}\` na \`${config.deniedHowLong}\` minut.`;
                        message += `Po tym czasie możesz ją sobie zdjąć komendą \`!mention clear\``;
                        const role = this.getRole(config) as Role;
                        this.message.reply(message);
                        member?.roles.add(role, 'Bo tak!');
                    }
                });
            });

    }

    private clear() {
        Promise.all([this.config$, this.mentions$])
            .then(([config, userMentions]) => {
                let member = this.message.member as GuildMember;
                let userIndex: string = member.id;
                if (userMentions[userIndex].length <=0 ) {
                    this.message.reply('Nie masz zapisanych żadnych wzmianek.');
                    return;
                }
                let message = '';
                let myMentions = userMentions[userIndex];
                //jeśli czas upłynął to czyścimy
                if (!this.deniedTimePassed(myMentions, config)) {
                    let howLong = this.getDeniedTimeRest(myMentions, config);
                    this.message.reply(`:exclamation: Czas kwarantanny nie upłynął. Pozostało ${howLong} minut.`);
                    return;
                }

                message += 'Czas kwarnatanny upłynął\n';
                message += 'Wszystkie wzmianki zostały wyczyszczone\n';
                userMentions[userIndex] = [];
                this.saveUserMentions(userMentions)
                    .then(() => {

                    });

                //jeśli dodatkowo ma rolę no-mentions to czyścimy
                if (this.hasDeniedRole(config)) {
                    message += 'Rola `[no-mentions]` została usunięta\n';
                } else {
                    message += 'nie miałeś roli `[no-mentions]`\n'
                }
                const role = this.getRole(config) as Role;
                member.roles.remove(role, 'Bo tak!');

                this.message.reply(message);
            });
    }

    private check() {
        Promise.all([this.config$, this.mentions$])
            .then(([config, userMentions]) => {
                let member = this.message.member as GuildMember;
                let userIndex: string = member.id;
                if (!userMentions[userIndex] || userMentions[userIndex].length <=0 ) {
                    this.message.reply('Nie masz zapisanych żadnych wzmianek.');
                    return;
                }
                // console.log(this.message.createdAt);
                let myMentions = userMentions[userIndex];
                let counter = 0;
                let message = 'Lista Twoich wzmianek:\n';
                myMentions.forEach((mention: UserMention) => {
                    let momentValue = moment(mention.time);
                    if (this.isInDeniedTime(momentValue, config.howLong)) {
                        message += ':x: `' + momentValue.format('YYYY-MM-DD HH:mm:ss') + '`\n';
                        counter++;
                    } else {
                        message += ':white_check_mark: `' + momentValue.format('YYYY-MM-DD HH:mm:ss') + '`\n';
                    }
                });

                message += `\n`;
                message += `:x: w ostatnich \`${config.howLong}\` minutach\n`;
                message += `:white_check_mark: przed \`${config.howLong}\` minutami\n`;
                message += `W ostanich \`${config.howLong}\` minutach użyłeś wzmianki \`${counter}\` razy. Limit to \`${config.howMany}\`\n`;
                message += '\n';
                if (this.hasDeniedRole(config)) {
                    let lastMessageAge = this.getLastMessageAge(myMentions);
                    message+= `:exclamation: Posiadasz rolę \`${config.deniedRole}\`\n`;
                    message+= `Ostatni raz użyłeś wzmianki \`${lastMessageAge}\` minut temu\n`;
                    if (this.deniedTimePassed(myMentions, config)) {
                        message += `Możesz usunąć rolę \`${config.deniedRole}\` komendą \`!mention clear\`\n`
                    } else {
                        let howLong = this.getDeniedTimeRest(myMentions, config);
                        message += `Będziesz mógł usunąć rolę \`${config.deniedRole}\` komendą \`!mention clear\` za \`${howLong}\` minut\n`;
                    }
                } else {
                    message+= `:white_check_mark: Obecnie nie posiadasz roli \`${config.deniedRole}\`\n`;
                }
                this.message.reply(message);
            });
    }

    private getDeniedTimeRest(myMentions: UserMention[], config: Config) {
        let lastMessageAge = this.getLastMessageAge(myMentions);
        return config.deniedHowLong - lastMessageAge;
    }

    private deniedTimePassed(myMentions: UserMention[], config: Config) {
        let lastMessageAge = this.getLastMessageAge(myMentions);
        return lastMessageAge > config.deniedHowLong;
    }

    private getLastMessageAge(myMentions: UserMention[]) {
        const now = moment(this.message.createdAt);
        let lastMessageDate = moment(myMentions[myMentions.length - 1].time);
        let diff = now.diff(lastMessageDate);
        let lastMessageAge = Math.floor(moment.duration(diff).asMinutes());
        // console.log('now:',now.format(), 'lastMessage:', lastMessageDate.format(), 'diff:', diff);
        return lastMessageAge;
    }

    private isInDeniedTime(momentValue: Moment, howLong: number) {
        const now = moment(this.message.createdAt);
        let allowedAgo = now.clone().subtract(howLong, 'minutes');
        return momentValue.isAfter(allowedAgo);
    }

    private hasDeniedRole(config: Config) {
        return this.message.member?.roles.cache.some( role => role.name === config.deniedRole);
    }

    private getRole(config: Config) {
        //todo sprawdzenie czy rola jest zdefiniowana
        return this.message.guild?.roles.cache.find(role => role.name === config.deniedRole);
    }

    private printConfig() {
        this.config$.then((config: Config) => {
            // console.log(config);
            let message = '```';
            message += "mentions:\n";
            config.mentions.forEach((mention: string) => {
                message += mention.replace('@', '@') + '\n';
            });
            message += 'howMany: ' + config.howMany + '\n';
            message += 'howLong: ' + config.howLong + '\n';
            message += 'deniedRole: ' + config.deniedRole + '\n';
            message += 'deniedHowLong: ' + config.deniedHowLong + '\n';
            message += '```';
            this.message.reply(message);
        });
    }

    private add(mention: string) {
        this.config$.then((config) => {
            let mentionToAdd = mention;
            if (mention[0] !== '@') {
                mentionToAdd = '@' + mention;
            }

            config.mentions.push(mentionToAdd);
            // console.log(config);
            this.saveConfig(config)
                .then((writeResult)=> {
                    // console.log('writeResult: ', writeResult);
                    this.message.channel.send(mentionToAdd.replace('@', '~~@~~') + ' dodane.');
                });
        })
    }

    private del(mention: string) {
        this.config$.then((config: Config) => {
            let mentionToDel = mention;
            if (mention[0] !== '@') {
                mentionToDel = '@' + mention;
            }

            let index = config.mentions.indexOf(mentionToDel);
            if (index < 0) {
                this.message.channel.send(`W konfiguracji nie ma tej wzmianki`);
                return
            }

            config.mentions.splice(index, 1);
            this.saveConfig(config)
                .then((writeResult) => {
                    // console.log('writeResult: ', writeResult);
                    this.message.channel.send(mentionToDel.replace('@', '~~@~~') + ' usunięte.');
                });
        });
    }

    private role(role:string) {
        this.config$.then((config: Config) => {
            config.deniedRole = role;
            this.saveConfig(config)
                .then((writeResult) => {
                    // console.log('writeResult: ', writeResult);
                    this.message.channel.send(`Ustawiona rola: ${role}`);
                })
        });
    }

    private setConfigOptions(deniedRole: string, howLong: number, howMany: number, deniedHowLong: number) {
        this.config$.then((config: Config) => {
            if (deniedRole) {
                config.deniedRole = deniedRole;
            }
            if (howLong) {
                config.howLong = howLong;
            }
            if (howMany) {
                config.howMany = howMany;
            }
            if (deniedHowLong) {
                config.deniedHowLong = deniedHowLong;
            }
            this.saveConfig(config)
                .then((writeResult) => {
                    // console.log('writeResult: ', writeResult);
                    //todo message
                    this.message.channel.send(`Ustawione opcje: `);
                })
        });

    }

    private isAdmin(member?: GuildMember) {
        if (!member) {
            return false;
        }
        return member.roles.cache.some(role => role.name === this.adminRoleName)
    }

    private saveConfig(config: Config) {
        return this.storage.setItem(this.configKey, config);
    }

    private saveUserMentions(mentions: UserMentions) {
        return this.storage.setItem(this.mentionsKey, mentions);
    }

    protected prepareUsage(): MessageEmbed {
        switch(this.subcommand) {
            case 'add':
                this.usageDefinition = this.commandUsageDefinition.add;
                break;
            case 'check':
                this.usageDefinition = this.commandUsageDefinition.check;
                break;
            case 'clear':
                this.usageDefinition = this.commandUsageDefinition.clear;
                break;
            case 'config':
                this.usageDefinition = this.commandUsageDefinition.config;
                break;
            case 'del':
                this.usageDefinition = this.commandUsageDefinition.del;
                break;
            case 'set':
                this.usageDefinition = this.commandUsageDefinition.set;
                break;

        }
        return super.prepareUsage();
    }
}
