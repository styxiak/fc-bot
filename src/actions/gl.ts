import {DbUtils} from "../utils/db-utils";
import {GuildMember, Message} from "discord.js";
import {UNIT_GAS, UNIT_JKLS, UNIT_JMLS, UNIT_REY, UNIT_SEE, UNIT_SLKR} from "../types/units";
import {ROLE_GAS, ROLE_JKLS, ROLE_JMLS, ROLE_REY, ROLE_SEE, ROLE_SLKR} from "../types/role";
import {Db} from "../db";
import {FCBot} from "../FCBot";
import {UserUtils} from "../utils/user-utils";
import {EmbedUtils} from "../utils/embed-utils";

;

export class Gl  {
    private mapping: any = {};

    private db: Db;
    private glToCheck = [
        UNIT_GAS,
        UNIT_JKLS,
        UNIT_JMLS,
        UNIT_REY,
        UNIT_SEE,
        UNIT_SLKR
    ];


    constructor() {
        this.mapping[UNIT_GAS] = ROLE_GAS;
        this.mapping[UNIT_JKLS] = ROLE_JKLS;
        this.mapping[UNIT_JMLS] = ROLE_JMLS;
        this.mapping[UNIT_REY] = ROLE_REY;
        this.mapping[UNIT_SEE] = ROLE_SEE;
        this.mapping[UNIT_SLKR] = ROLE_SLKR;
        this.db = new Db();
    }

    async execute() {
        const importId = await DbUtils.getLastImportId();
        const guild = FCBot.getGuild();
        const addedRoles: string[] = [];

        for (const glName of this.glToCheck) {
            const glQuery = 'select pd.name from player_data as pd\n' +
                'LEFT JOIN unit u on pd.id = u.player_data_id\n' +
                'where u.base_id = ? AND pd.import_id = ?;'
            let playersToCheck = await this.db.asyncQuery(glQuery, [glName, importId]);
            console.log('PlayersToCheck', playersToCheck);
            playersToCheck.forEach((player:any) => {
                let member = guild.members.cache.find(member => player.name === UserUtils.getNormalizedNick(member)) as GuildMember;
                let roleId = this.mapping[glName];
                console.log('check roleId', roleId);
                if (!member.roles.cache.some(role => role.id === roleId)) {
                    console.log(' don\'t have role, give it to him' );
                    member.roles.add(roleId).then(() => {
                        addedRoles.push(`Nadaję rolę dla **${glName}** użytkownikowi **${UserUtils.getNormalizedNick(member)}**`);
                    })
                }
            });
        }

        if (addedRoles.length > 0) {
            let embed = EmbedUtils.embed();
            let message = addedRoles.join('\n');
            embed.setDescription(message);
            FCBot.postLog(embed);
        }
    }

}
