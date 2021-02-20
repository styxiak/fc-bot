import {GuildMember, User} from "discord.js";
import {FCBot} from "../FCBot";

const emojiStrip = require("emoji-strip");

export class UserUtils {

    static getNick(user: User | GuildMember | null) {
        if (null === user) {

            return '';
        }

        if (user instanceof GuildMember) {

            return user.nickname ?? user.user.username
        }

        return user.username;
    }

    static normalizeNick(nick: string | null): string {
        if (null === nick) {
            return '';
        }
        return emojiStrip(nick).replace('☆', '').replace('★', '').trim()
    }

    static getNormalizedNick(user: User | GuildMember | null) {
        return UserUtils.normalizeNick(UserUtils.getNick(user));
    }

    static getUserFromMention(mention:string): User | null {
        if (!mention) {

            return null;
        }

        if (mention.startsWith('<@') && mention.endsWith('>')) {
            mention = mention.slice(2, -1);
            if (mention.startsWith('!')) {
                mention = mention.slice(1);
            }

            let user = FCBot.client.users.cache.get(mention);
            if (!user) {

                return null;
            }

            return user;
        }

        return null;
    }

    public static getMemberFromString(text: string): GuildMember|null {

        let result = null;

        const split = text.split(/ +/);

        let username: string = '';
        split.forEach((value: string) => {
            console.log(value)
            if (username.length > 0) {

                return;
            }
            if (value.startsWith('@')) {
                username = value.slice(1);
                console.log(username);
            }
        });

        return result;
    }
}
