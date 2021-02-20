import moment from "moment";
import {Db} from "../db";
import {FCBot} from "../FCBot";
import {Color} from "../utils/color";
import {EmbedUtils} from "../utils/embed-utils";

export class RosterWatcher {
    private db: Db;

    constructor() {
        this.db = new Db();
    }

    async checkDaily() {
        await this.sendDiffrences();

    }

    private async sendDiffrences() {
        let todayImportId = await this.getTodayImportId();
        let yesterdayImportId = await this.getYesterdayImportId();
        let diffrences = await this.getDiffrenceInRoster(todayImportId, yesterdayImportId);

        if (todayImportId === null || yesterdayImportId === null) {
            return;
        }

        let newPlayers: string[] = [];
        let retiredPlayers: string[] = [];

        diffrences.forEach((player: any) => {
            if (player.today_name == null) {
                retiredPlayers.push(player.name);
            }
            if (player.yesterday_name == null) {
                newPlayers.push(player.name);
            }
        });


        if (newPlayers.length > 0 || retiredPlayers.length > 0) {
            let embed = EmbedUtils.embed();
            embed.title = 'Zmienił się skład gildii'

            if (retiredPlayers.length > 0) {
                embed.addField('**Opuścili nas:**', retiredPlayers.join("\n"))
            }
            if (newPlayers.length > 0) {
                embed.addField('**Przybyli do nas:**', newPlayers.join("\n"))
            }

            FCBot.postLog(embed);
        }

    }

    private async getDiffrenceInRoster(todayImportId: string, yesterdayImportId: string) {
        let query = `select distinct grand.name, today.name as today_name, yesterday.name as yesterday_name
from player_data as grand
left join player_data as today on today.ally_code = grand.ally_code and today.import_id = '${todayImportId}'
left join player_data as yesterday on yesterday.ally_code = grand.ally_code and yesterday.import_id = '${yesterdayImportId}'
where (grand.import_id = '${todayImportId}' or grand.import_id = '${yesterdayImportId}')
and (today.name is null or yesterday.name is null)`
        return await this.db.asyncQuery(query);
    }

    private async getTodayImportId() {
        let d = moment();
        let dateString = d.format('YYYY-MM-DD');
        let query = 'select import_id from player_data where DATE(created_at) = ? limit 1';
        let result = await this.db.asyncQuery(query, [dateString]);
        if (result.length === 0) {
            RosterWatcher.sendMissigImportError(dateString);

            return null;
        }
        return (result[0].import_id);
    }


    private async getYesterdayImportId() {
        let d = moment();
        d.subtract(1, 'day');
        let dateString = d.format('YYYY-MM-DD');
        let query = 'select import_id from player_data where DATE(created_at) = ? limit 1';
        let result = await this.db.asyncQuery(query, [dateString]);
        if (result.length === 0) {
            RosterWatcher.sendMissigImportError(dateString);

            return null;
        }
        return (result[0].import_id);

    }

    private static sendMissigImportError(date: string)
    {
        let embed = EmbedUtils.embed();
        embed.setColor(Color.RED)
            .setTitle('Brak imporu')
            .setDescription(`Nie znalazłem importu z dnia **${date}**`);
        FCBot.postLog(embed);
    }

}
