import {AbstractCommand, OptionDefinition, UsageDefinition} from "../abstract-command";
import {Channel, Collection, Guild, GuildMember, Message, MessageEmbed, Snowflake} from "discord.js";
import {Connection, createConnection, MysqlError} from "mysql";
import {FCBot} from "../FCBot";
import {ROLE_ECHO_ADMIN, ROLE_ECHO_COMMANDER, ROLE_GUILD, ROLE_MEMBER, ROLE_OFFICER} from "../types/role";
import {UserUtils} from "../utils/user-utils";
import {EmbedUtils} from "../utils/embed-utils";

const commandLineArgs = require("command-line-args");

export class Discord extends AbstractCommand {

    protected prefix = 'discord';
    protected optionsDefinition: OptionDefinition[] = [
        {
            name: 'type',
            type: String,
            alias: 'c',
            description: 'Type',
            typeLabel: '__type__',
            defaultOption: true,
        },
        {
            name: 'help',
            type: Boolean,
            alias: 'h',
            description: 'Pomoc'
        }
    ]

    protected usageDefinition: UsageDefinition[] = [
        {
            header: 'x',
            description: "Porządki na discordzie"
        },
        {
            header: "Opcje",
            optionList: this.optionsDefinition
        }
    ];

    protected mysqlConn: Connection;
    private dbUsers: any[] = [];

    constructor(message: Message) {
        super(message);
        this.parseOptions();
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
        this.checkUsers();
    }

    checkUsers() {
        let dbUsers: any[];
        dbUsers = [];
        let query = "SELECT import_id from player_data order by import_id LIMIT 1";
        this.mysqlConn.query(query)
            .on('result', (data: any) => {
                console.log(data);
                query = `SELECT * from player_data where import_id ='${data.import_id}'`;
                this.mysqlConn.query(query)
                    .on('result', (data: any) => {
                        console.log(data);
                        dbUsers.push(data);
                    })
                    .on('error', (err: MysqlError) => {
                        this.error(err.message);
                    })
                    .on('end', () => {
                        this.dbUsers = dbUsers;
                        this.parseUsers(dbUsers);
                    });
            })
            .on('error', (err: MysqlError) => {
                this.error(err.message);
            })
            .on('end', () => {
            })
        ;
    }

    private parseUsers(dbUsers: any[]) {
        let guild = FCBot.client.guilds.cache.get('409376390308167682') as Guild;
        console.log(guild.memberCount);
        let chatChannel = FCBot.client.channels.cache.get('409376390753026063') as Channel;
        let wrongNicks: string[] = [];
        let extraRoles: BadRole[];
        let missingRoles: BadRole[];
        guild.members.fetch()
            .then((members: Collection<Snowflake, GuildMember>) => {
                // Ludzie których nicki nie pasują
                wrongNicks = this.checkNicks(members);
                extraRoles = this.checkExtraRoles(members);
                missingRoles = this.checkMissingRoles(members);
                console.log(missingRoles);
            })
            .finally(() => {
                console.log(wrongNicks);
                let embed = EmbedUtils.embed();
                this.addWrongNicks(embed, wrongNicks);
                embed.addField('\u200b', '\u200b');
                this.addExtraRoles(embed, extraRoles);
                this.addMissingRoles(embed, missingRoles);
                this.message.channel.send(embed);
            });
    }

    private checkNicks(members: Collection<Snowflake, GuildMember>): string[] {
        let wrongNicks: string[] = [];
        this.dbUsers.forEach(dbUser => {
            if (!members.some((member) => UserUtils.getNormalizedNick(member).toLowerCase() === dbUser.name.toLowerCase())) {
                wrongNicks.push(dbUser.name);
            }
        })

        return wrongNicks;
    }

    private addWrongNicks(embed: MessageEmbed, wrongNicks: string[]) {
        if (wrongNicks.length === 0) {
            embed.addField('**Nie znalazłem błędnych nicków**', '\u200b');
        } else {
            let field  = '';
            wrongNicks.forEach(nick => {
                field += `**${nick}**\n`;
            })
            embed.addField('**Nie znalazłem na Discord:**', field);
        }
    }

    private checkExtraRoles(members: Collection<Snowflake, GuildMember>): BadRole[] {
        let badRoles: BadRole[] = [];
        members.forEach(member => {
            console.log(member.nickname ?? member.user.username, this.isInGuild(member));
            let user = this.isInGuild(member);
            let roles: string[] = [];
            if (!user) {
                if (member.roles.cache.get(ROLE_GUILD)) {
                    roles.push('guild');
                }
                if (member.roles.cache.get(ROLE_MEMBER)) {
                    roles.push('member');
                }
                if (member.roles.cache.get(ROLE_OFFICER)) {
                    roles.push('officer');
                }
                if (member.roles.cache.get(ROLE_ECHO_ADMIN)) {
                    roles.push('EchoAdmin');
                }
                if (member.roles.cache.get(ROLE_ECHO_COMMANDER)) {
                    roles.push('EchoCommander');
                }
                if (roles.length === 0) {
                    return;
                }
                let badRole: BadRole = {
                    nick: member.nickname ?? member.user.username,
                    roles: roles
                }
                badRoles.push(badRole);
            } else {
                switch (user.guild_member_level) {
                    case 2:
                        if (member.roles.cache.get(ROLE_OFFICER)) {
                            roles.push('officer');
                        }
                        if (member.roles.cache.get(ROLE_ECHO_ADMIN)) {
                            roles.push('EchoAdmin');
                        }
                        if (member.roles.cache.get(ROLE_ECHO_COMMANDER)) {
                            roles.push('EchoCommander');
                        }
                        break;
                    case 3:
                        if (member.roles.cache.get(ROLE_MEMBER)) {
                            roles.push('member');
                        }
                        break;
                }
                if (roles.length === 0) {
                    return;
                }
                let badRole: BadRole = {
                    nick: UserUtils.getNick(member),
                    roles: roles
                }
                badRoles.push(badRole);

            }
        });
        return badRoles;
    }

    private addExtraRoles(embed: MessageEmbed, badRoles: BadRole[]) {
        if (badRoles.length === 0) {
            embed.addField('**Nie znalazłem błędnych nadmiarowych ról**', '\u200b');
        } else {
            let field  = '';
            badRoles.forEach(role => {
                let stringRoles = role.roles.join(', ');
                field += `**${role.nick}**: ${stringRoles}\n`;
            })
            embed.addField('**Czyżby za dużo ról?**', field, true);
        }
    }

    private checkMissingRoles(members: Collection<Snowflake, GuildMember>): any[] {
        let badRoles: BadRole[] = [];
        members.forEach(member => {
            let user = this.isInGuild(member);
            if (!user) {

                return;
            }
            let roles: string[] = [];
            if (!member.roles.cache.get(ROLE_GUILD)) {
                roles.push('guild');
            }

            switch (user.guild_member_level) {
                case 2:
                    if (!member.roles.cache.get(ROLE_MEMBER)) {
                        roles.push('member');
                    }
                    break;
                case 3:
                    if (!member.roles.cache.get(ROLE_OFFICER)) {
                        roles.push('officer');
                    }
                    if (!member.roles.cache.get(ROLE_ECHO_ADMIN)) {
                        roles.push('EchoAdmin');
                    }
                    if (!member.roles.cache.get(ROLE_ECHO_COMMANDER)) {
                        roles.push('EchoCommander');
                    }
                    break;
            }

            if (roles.length === 0) {
                return;
            }
            let badRole: BadRole = {
                nick: member.nickname ?? member.user.username,
                roles: roles
            }
            badRoles.push(badRole);

        });
        return badRoles;
    }

    private addMissingRoles(embed: MessageEmbed, badRoles: BadRole[]) {
        if (badRoles.length === 0) {
            embed.addField('**Nie znalazłem brakujących ról**', '\u200b');
        } else {
            let field  = '';
            badRoles.forEach(role => {
                let stringRoles = role.roles.join(', ');
                field += `**${role.nick}**: ${stringRoles}\n`;
            })
            embed.addField('**Brakujące role:**', field, true);
        }
    }

    private isInGuild(member: GuildMember) {
        return this.dbUsers.find(dbUser => dbUser.name === UserUtils.getNormalizedNick(member));
    }
}

interface BadRole {
    nick: string;
    roles: string[];
}

