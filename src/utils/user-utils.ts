import {GuildMember, User} from "discord.js";

export class UserUtils {

    public static getNick(user: User | GuildMember | null) {
        if (null === user) {

            return '';
        }

        if (user instanceof GuildMember) {

            return user.nickname ?? user.user.username
        }

        return user.username;
    }
}
