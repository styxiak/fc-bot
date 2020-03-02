import { Message } from 'discord.js';
import { Command } from '../command';

export class Kick implements Command{

    private message: Message;

    constructor(message: Message) {
        this.message = message;
    }

    execute() {
        const user = this.message.mentions.users.first();
        if (!user) {
            this.message.reply(`Brakuje informacji, kogo chcesz wyrzucić z serwera?`);
            return;
        }

        const member = this.message.guild.member(user);
        if (!member) {
            this.message.reply(`Brakuje informacji, kogo chcesz wyrzucić z serwera?`)
            return;
        }

        if (!member.kickable) {
            this.message.reply(`Nie mogę wyżucić tego użytkownika`);
            return;
        }

        member
            .kick('Wyrzucony przez administrację serwera')
            .then(() => {
                this.message.reply(`${user.tag} został wyrzucony.`);
            })
            .catch(err => {
                this.message.reply(`Wystąpił błąd podczas wyrzucania użytkownika.`);
                console.error(err);
            });

    }

}
