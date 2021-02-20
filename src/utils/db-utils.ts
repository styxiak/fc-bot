import {Db} from "../db";

export class DbUtils {

    static async getLastImportId() {
        let db = new Db();
        let query = 'SELECT import_id from player_data ORDER BY created_at DESC LIMIT 1';
        let result = await db.asyncQuery(query);
        if (result.length === 0) {
            throw new Error('Import not found');
        }

        return result[0].import_id;
    }

}
