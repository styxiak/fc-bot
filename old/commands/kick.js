module.exports = message => {
    const user = message.mentions.users.first();
    if (user) {
        const member = message.guild.member(user);
        if (!member) {
            return message.reply(`Brakuje informacji, kogo chcesz wyrzucić z serwera?`)
        }

        if (!member.kickable) {
            return message.reply(`Nie mogę wyżucić tego użytkownika`);
        }

        return member
            .kick('Wyrzucony przez administrację serwera')
            .then(() => {
                message.reply(`${user.tag} został wyrzucony.`);
            })
            .catch(err => {
                message.reply(`Wystąpił błąd podczas wyrzucania użytkownika.`);
                console.error(err);
            });
    } else message.reply(`Brakuje informacji, kogo chcesz wyrzucić z serwera?`);
};
