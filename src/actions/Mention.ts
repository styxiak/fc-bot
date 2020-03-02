import { GuildMember, Message } from "discord.js";
import { Command } from '../command';

import storage from 'node-persist';
import NodePersist from 'node-persist';
import moment, { Moment } from 'moment';


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

export class Mention implements Command {

    public static readonly prefix = 'mention';
    private message: Message;
    private subcommand: string|null = null;
    private adminRoleName = 'FC Bot Admin';

    config$: Promise<Config>;
    mentions$: Promise<UserMentions>;
    // config: Config;

    private acceptedCommands = [
        'help',
        'add',
        'del',
        'role',
        'config',
        'check',
        'clear',
        'howLong',
        'howMany',
        'deniedHowLong',

    ];

    private storage: NodePersist.LocalStorage;
    private configKey: string = 'mentionsConfig';
    private mentionsKey: string = 'usersMentions';

    constructor(message: Message) {
        this.message = message;
        this.storage = storage.create();
        let initStorage$ = this
            .storage
            .init({
                logging: true,
                dir: process.cwd() + '/../data/storage',
            });
        this.config$ = initStorage$
            .then((val) => {
                console.log('config.init: ', val);
                return this.storage.keys();
            })
            .then((keys) => {
                console.log('config.keys: ', keys);
                if (keys.indexOf(this.configKey) < 0) {
                    console.log('config is empty, set default');
                    return this.saveConfig(defaultConfig);
                }
                console.log('config get item');
                return this.storage.getItem(this.configKey);
            })
            .catch((reason) => {
                console.error(`Error initializing config: ${reason}`);
            });
        this.config$
            .then((config:Config) => {
                console.log('config.result: ', config);
            })
            .catch((reason) => {
                console.error(`Error initializing config: ${reason}`);
            });

        this.mentions$ = initStorage$
            .then((val) => {
                console.log('config.init: ', val);
                return this.storage.keys();
            })
            .then((keys) => {
                console.log('config.keys: ', keys);
                if (keys.indexOf(this.mentionsKey) < 0) {
                    console.log('mentions are empty, set default');
                    let mentions = new class implements UserMentions {
                        [key: string]: UserMention[];
                    };
                    return this.saveUserMentions(mentions);

                }
                console.log('mentions get item');
                return this.storage.getItem(this.mentionsKey);
            })
            .catch((reason) => {
                console.error(`Error initializing mentions: ${reason}`);
            });
        this.mentions$
            .then((mentions:UserMentions) => {
                console.log('mentions.result: ', mentions);
                // this.config = config;
            })
            .catch((reason) => {
                console.error(`Error initializing mentions: ${reason}`);
            });

    }

    execute(): void {
        let parts = this.message.content.split(' ');
        console.log('parts', parts);
        this.subcommand = 'help';
        if (parts[1]) {
            this.subcommand = parts[1];
        }
        console.log('subcommand', this.subcommand);
        if (this.acceptedCommands.indexOf(this.subcommand) < 0) {
            this.message.reply(`Nieznana komenda: ${Mention.prefix} ${this.subcommand}. Spróbuj !${Mention.prefix} help`);
            return;
        }
        switch (this.subcommand) {
            case 'help':
                this.message.reply("lista komend !mentions:\n" + this.acceptedCommands.join('\n'));
                break;
            case 'add':
                if (!this.isAdmin(this.message.member)) {
                    this.message.reply(`Aby użyc tej komendy musisz mieć rolę: ${this.adminRoleName}`);
                    break;
                }
                this.add(parts[2]);
                break;
            case 'del':
                if (!this.isAdmin(this.message.member)) {
                    this.message.reply(`Aby użyc tej komendy musisz mieć rolę: ${this.adminRoleName}`);
                    break;
                }
                this.del(parts[2]);
                break;
            case 'role':
                if (!this.isAdmin(this.message.member)) {
                    this.message.reply(`Aby użyc tej komendy musisz mieć rolę :${this.adminRoleName}`);
                    break;
                }
                this.role(parts[2]);
                break;
            case 'howLong':
                if (!this.isAdmin(this.message.member)) {
                    this.message.reply(`Aby użyc tej komendy musisz mieć rolę :${this.adminRoleName}`);
                    break;
                }
                let howLong = parseInt(parts[2]);
                this.howLong(howLong);
                break;
            case 'howMany':
                if (!this.isAdmin(this.message.member)) {
                    this.message.reply(`Aby użyc tej komendy musisz mieć rolę :${this.adminRoleName}`);
                    break;
                }
                let howMany = parseInt(parts[2]);
                this.howMany(howMany);
                break;
            case 'deniedHowLong':
                if (!this.isAdmin(this.message.member)) {
                    this.message.reply(`Aby użyc tej komendy musisz mieć rolę :${this.adminRoleName}`);
                    break;
                }
                let deniedHowLong = parseInt(parts[2]);
                this.deniedHowLong(deniedHowLong);
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
                console.log('readed from storage: config', config, 'mentions:', userMentions);

                let userIndex: string = this.message.member.id;
                config.mentions.forEach((mention) => {
                    if (this.message.content.indexOf(mention) < 0) {
                        return;
                    }

                    let now = moment(this.message.createdAt);
                    console.log('Mentions detected: ' + mention + ' by user: ' + this.message.member);
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
                        console.log(momentValue);
                        if (momentValue.isAfter(allowedAgo)) {
                            counter++;
                        }
                    });
                    console.log(counter);
                    console.log(userMentions);
                    if (config.howMany - 1 === counter) {
                        this.message.reply(`Jeszcze jedna wzmianka i zostaniesz uciszony.`);
                    }
                    if (config.howMany === counter) {
                        this.message.reply(`To był Twój ostatni raz!`);
                    }
                    if (config.howMany < counter) {
                        let message = `Dostajesz rolę \`${config.deniedRole}\` na \`${config.deniedHowLong}\` minut.`;
                        message += `Po tym czasie możesz ją sobie zdjąć komendą \`!mention clear\``;
                        const role = this.getRole(config);
                        this.message.reply(message);
                        this.message.member.addRole(role, 'Bo tak!');
                    }
                });
            });

    }

    private clear() {
        Promise.all([this.config$, this.mentions$])
            .then(([config, userMentions]) => {
                let userIndex: string = this.message.member.id;
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
                const role = this.getRole(config);
                this.message.member.removeRole(role, 'Bo tak!');

                this.message.reply(message);
            });
    }

    private check() {
        Promise.all([this.config$, this.mentions$])
            .then(([config, userMentions]) => {
                let userIndex: string = this.message.member.id;
                if (!userMentions[userIndex] || userMentions[userIndex].length <=0 ) {
                    this.message.reply('Nie masz zapisanych żadnych wzmianek.');
                    return;
                }
                console.log(this.message.createdAt);
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
        console.log('now:',now.format(), 'lastMessage:', lastMessageDate.format(), 'diff:', diff);
        return lastMessageAge;
    }

    private isInDeniedTime(momentValue: Moment, howLong: number) {
        const now = moment(this.message.createdAt);
        let allowedAgo = now.clone().subtract(howLong, 'minutes');
        return momentValue.isAfter(allowedAgo);
    }

    private hasDeniedRole(config: Config) {
        return this.message.member.roles.exists('name', config.deniedRole);
    }

    private getRole(config: Config) {
        //todo sprawdzenie czy rola jest zdefiniowana
        return this.message.guild.roles.find('name', config.deniedRole);
    }

    private printConfig() {
        this.config$.then((config: Config) => {
            console.log(config);
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
            console.log(config);
            this.saveConfig(config)
                .then((writeResult)=> {
                    console.log('writeResult: ', writeResult);
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
                    console.log('writeResult: ', writeResult);
                    this.message.channel.send(mentionToDel.replace('@', '~~@~~') + ' usunięte.');
                });
        });
    }

    private role(role:string) {
        this.config$.then((config: Config) => {
            config.deniedRole = role;
            this.saveConfig(config)
                .then((writeResult) => {
                    console.log('writeResult: ', writeResult);
                    this.message.channel.send(`Ustawiona rola: ${role}`);
                })
        });
    }

    private howLong(howLong: number) {
        this.config$.then((config: Config) => {
            config.howLong = howLong;
            this.saveConfig(config)
                .then((writeResult) => {
                    console.log('writeResult: ', writeResult);
                    this.message.channel.send(`Ustawiony przedział czasu: ${howLong}`);
                })
        });
    }

    private howMany(howMany: number) {
        this.config$.then((config: Config) => {
            config.howMany = howMany;
            this.saveConfig(config)
                .then((writeResult) => {
                    console.log('writeResult: ', writeResult);
                    this.message.channel.send(`Ustawiona ilość dozwolonych wzmianek: ${howMany}`);
                })
        });
    }

    private deniedHowLong(deniedHowLong: number) {
        this.config$.then((config: Config) => {
            config.deniedHowLong = deniedHowLong;
            this.saveConfig(config)
                .then((writeResult) => {
                    console.log('writeResult: ', writeResult);
                    this.message.channel.send(`Ustawiony czas kwarantanny: ${deniedHowLong}`);
                })
        });
    }

    private isAdmin(member: GuildMember) {
        return member.roles.some(role => role.name === this.adminRoleName)
    }

    private saveConfig(config: Config) {
        return this.storage.setItem(this.configKey, config);
    }

    private saveUserMentions(mentions: UserMentions) {
        return this.storage.setItem(this.mentionsKey, mentions);
    }

}
