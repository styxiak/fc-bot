import exp from "constants";
import {ClientUser, MessageEmbed} from "discord.js";
import {Color} from "./color";
import {FCBot} from "../FCBot";

export class EmbedUtils {

    static embed(): MessageEmbed {

        let user = FCBot.client.user as ClientUser;
        return new MessageEmbed()
            .setAuthor('D-O', user.displayAvatarURL(), 'https://github.com/styxiak/fc-bot')
            .setThumbnail('http://chuchmala.pl/static/bio_hazard.png')
            .setTimestamp()
            .setColor(Color.DEFAULT)
            .setFooter('D-O -.. -....- ---', 'http://chuchmala.pl/static/final-countdown/fc-icon.png');

    }
}
