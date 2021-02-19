import {AbstractCommand, OptionDefinition, UsageDefinition} from "../abstract-command";
import {Collection, GuildMember, Message, Snowflake, TextChannel} from "discord.js";
import {FCBot} from "../FCBot";
import {UserUtils} from "../utils/user-utils";
import {
    ROLE_ADMIN,
    ROLE_ALLY,
    ROLE_ECHO_ADMIN,
    ROLE_ECHO_COMMANDER,
    ROLE_FORMER_MEMBER,
    ROLE_FORMER_OFFICER,
    ROLE_GUEST,
    ROLE_GUILD,
    ROLE_LEADER,
    ROLE_MEMBER,
    ROLE_OFFICER,
    ROLE_RETIRED
} from "../types/role";
import {CHANNEL_LOG} from "../types/channel";


export class Guild extends AbstractCommand {

    protected prefix = '';
    protected optionsDefinition: OptionDefinition[] = [];
    protected usageDefinition: UsageDefinition[] = [];

    private member: GuildMember| null = null;
    private commandUser: GuildMember | null = null;
    private command: string = '';

    constructor(message: Message) {
        super(message);
        this.parseOptions();
    }

    private parseOptions() {
        let messageContent = this.message.content.trim();
        this.command = messageContent.split(' ')[0].replace(FCBot.prefix, '').toLowerCase();
        this.commandUser = this.message.member;
        console.log(this.command);
        if (this.command !== 'guild') {
            this.member = ((this.message.mentions.members as Collection<Snowflake, GuildMember>).first() as GuildMember);
        }
    }

    execute() {

        if(!(this.commandUser as GuildMember).roles.cache.some(r => [ROLE_OFFICER, ROLE_LEADER, ROLE_ADMIN].includes(r.id)) ) {
            this.message.reply(`Nie masz uprawnień by używać tej komendy`);
            return;
        }

        if (this.command !== 'guild' && !this.member) {
            this.message.reply(`Brakuje informacji, komu chcesz zmienić role`);
            return;
        }

        switch (this.command) {
            case 'guild':
                this.showUsage();
                return;
            case 'enlist':
                this.enlist();
                return;
            case 'promote':
                this.promote();
                return;
            case 'demote':
                this.demote();
                return;
            case 'expel':
                this.expel();
                return;
            case 'retire':
                this.retire();
                return;
        }
    }

    /**
     - enlist (+guild, +member)
     */
    private enlist() {
        console.log("Enlist");
        (this.member as GuildMember)
            .roles
            .add([ROLE_GUILD, ROLE_MEMBER], 'Enlist')
            .then(() => {
                this.postLog(`**${UserUtils.getNick(this.member)}** został dodany do gildii przez **${UserUtils.getNick(this.commandUser)}**`);
                this.message.reply(`Dodałeś **${UserUtils.getNick(this.member)}** do gildii`);
            })
            .catch(this.handleError)
    }

    /**
     - promote (+officer, -member)
     */
    private promote() {
        (this.member as GuildMember)
            .roles
            .add([ROLE_GUILD, ROLE_OFFICER, ROLE_ECHO_COMMANDER, ROLE_ECHO_ADMIN], 'Promote')
            .then(() => {
                (this.member as GuildMember)
                    .roles
                    .remove([ROLE_MEMBER], 'Promote')
                    .then(() => {
                        this.postLog(`**${UserUtils.getNick(this.member)}** został awansowany na oficera przez **${UserUtils.getNick(this.commandUser)}**`)
                        this.message.reply(`Awansowałeś **${UserUtils.getNick(this.member)}** na oficera`);
                    });
            })
            .catch(this.handleError)
        ;

    }

    /**
     - demote (+member, -officer)
     */
    private demote() {
        ((this.member as GuildMember)
            .roles
            .add([ROLE_GUILD, ROLE_MEMBER], 'Demote'))
            .then(() => {
                (this.member as GuildMember)
                    .roles
                    .remove([ROLE_OFFICER, ROLE_ECHO_COMMANDER, ROLE_ECHO_ADMIN], 'Demote')
                    .then(() => {
                        this.postLog(`**${UserUtils.getNick(this.member)}** został zdegradowany przez **${UserUtils.getNick(this.commandUser)}**`)
                        this.message.reply(`Zdegradowałeś **${UserUtils.getNick(this.member)}**`);
                    });
            })
            .catch(console.error);
    }

    /**
     - expel (+former member/officer, -member/officer, -guild, +guest, +ally)
     */
    private expel() {
        let rolesToAdd = [
            ROLE_GUEST,
            ROLE_ALLY,
        ];
        let rolesToRemove = [
            ROLE_GUILD,
            ROLE_ECHO_COMMANDER,
            ROLE_ECHO_ADMIN,
        ];
        if((this.member as GuildMember).roles.cache.has(ROLE_OFFICER)) {
            rolesToAdd.push(ROLE_FORMER_OFFICER);
            rolesToRemove.push(ROLE_OFFICER);
        } else {
            rolesToAdd.push(ROLE_FORMER_MEMBER);
            rolesToRemove.push(ROLE_MEMBER);
        }

        (this.member as GuildMember)
            .roles
            .add(rolesToAdd, 'Expel')
            .then(() => {
                (this.member as GuildMember)
                    .roles
                    .remove(rolesToRemove, 'Expel')
                    .then(() => {
                        this.postLog(`**${UserUtils.getNick(this.member)}** został wyrzuconyz gildii przez **${UserUtils.getNick(this.commandUser)}**`)
                        this.message.reply(`Wyrzuciłeś **${UserUtils.getNick(this.member)}** z gildii`);
                    })
            })
            .catch(this.handleError)
        ;
    }

    /**
     - retire (jak expel oraz +retired)
     */
    private retire() {
        let rolesToAdd = [
            ROLE_GUEST,
            ROLE_ALLY,
            ROLE_RETIRED,
        ];
        let rolesToRemove = [
            ROLE_GUILD,
            ROLE_ECHO_COMMANDER,
            ROLE_ECHO_ADMIN,
        ];
        if((this.member as GuildMember).roles.cache.has(ROLE_OFFICER)) {
            rolesToAdd.push(ROLE_FORMER_OFFICER);
            rolesToRemove.push(ROLE_OFFICER);
        } else {
            rolesToAdd.push(ROLE_FORMER_MEMBER);
            rolesToRemove.push(ROLE_MEMBER);
        }

        (this.member as GuildMember)
            .roles
            .add(rolesToAdd, 'Retire')
            .then(() => {
                (this.member as GuildMember)
                    .roles
                    .remove(rolesToRemove, 'Retire')
                    .then(() => {
                        this.postLog(`**${UserUtils.getNick(this.member)}** został wysłany na emeryturę przez **${UserUtils.getNick(this.commandUser)}**`)
                        this.message.reply(`Wysłałeś na emeryturę **${UserUtils.getNick(this.member)}**`);
                    });
            })
            .catch(this.handleError)
        ;
    }

    public postLog(message: string) {
        FCBot.client.channels
            .fetch(CHANNEL_LOG).then((channel) => (channel as TextChannel)
            .send(message));
    }

    showUsage() {
        const embed = FCBot.embed();
        embed.addField('__**Dostępne komendy**__',
            '**enlist** - dodanie do gildii\n' +
            '**promote** - promocja na oficera\n' +
            '**demote** - degradacja oficera\n' +
            '**expel** - usunięcie z gildii\n' +
            '**retire** - zakończenie gry\n'
        )
        this.message.channel.send(embed);
    }

    handleError(err: Error) {
        console.error(JSON.stringify(err));
        this.message.reply(`Akcja się nie powiodła: ${err.message}`)
    }
}
