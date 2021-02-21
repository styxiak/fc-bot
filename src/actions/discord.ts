import {AbstractCommand, OptionDefinition, UsageDefinition} from "../abstract-command";
import {Collection, GuildMember, Message, MessageEmbed, Snowflake} from "discord.js";
import {FCBot} from "../FCBot";
import {ROLE_ECHO_ADMIN, ROLE_ECHO_COMMANDER, ROLE_GUILD, ROLE_MEMBER, ROLE_OFFICER} from "../types/role";
import {UserUtils} from "../utils/user-utils";
import {EmbedUtils} from "../utils/embed-utils";
import {Db} from "../db";
import {DbUtils} from "../utils/db-utils";

export class Discord extends AbstractCommand {

    protected prefix = 'discord';
    protected optionsDefinition: OptionDefinition[] = [
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
            description: 'Porządki na discordzie'
        },
    ];

    private dbUsers: any[] = [];
    private db: Db;

    constructor(message: Message) {
        super(message);
        this.parseOptions();
        this.db = new Db();
    }


    execute(): void {
        if (this.options.help) {
            this.showUsage();
            return;
        }

        this.checkUsers();
    }

    async checkUsers() {
        let dbUsers: any[];
        let importId = await DbUtils.getLastImportId();
        let query = 'SELECT * from player_data where import_id = ?';
        this.dbUsers = await this.db.asyncQuery(query, [importId]);
        this.parseUsers();
    }

    private parseUsers() {
        let guild = FCBot.getGuild();
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

