import {Connection, createConnection, queryCallback, QueryOptions} from "mysql";

export class Db {

    conn: Connection;

    constructor() {
        let connectionUri = {
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASS,
            database: process.env.MYSQL_DB,
            multipleStatements: true
        };
        this.conn = createConnection(connectionUri);
        this.setUpconnection();
        this.handleDisconnect();
    }

    setUpconnection() {
        this.conn.connect((err) => {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            console.log('connected as id ', this.conn.threadId);
        });

        this.conn.on("close", (err) => {
            console.log(`SQL CONNECTION CLOSED: ${err}`);
        });
    }

    handleDisconnect() {
        this.conn.on('error', (err) => {
            console.log('Re-connecting lost connection');
            this.conn.destroy();
            this.setUpconnection();
            this.handleDisconnect();
        });
    }


    asyncQuery(options: string | QueryOptions, values?: any): Promise<any> {
        console.log(options, values);
        return new Promise((resolve, reject) => {
            this.conn.query(options, values, (err, result) => {
                if ( err ) {
                    console.error(err.message);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
}
