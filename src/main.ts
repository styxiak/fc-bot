import "reflect-metadata";
import { FCBot } from './FCBot';
import { config } from 'dotenv';
import {ErrorHandler} from "./error/error-handler";
import {DiscordLogger} from "./error/discord-logger";
import {RosterWatcher} from "./actions/roster-watcher";
import {Gl} from "./actions/gl";

const cron = require("node-cron");

console.log(process.env.NODE_ENV);

if (process.env.NODE_ENV && process.env.NODE_ENV === 'dev') {
    config({ path: __dirname + `/../.env.dev`});
} else {
    config();
}

const errorHandler = new ErrorHandler();

process.on('uncaughtException', (error: Error) => {
    errorHandler.handleError(error);
});

process.on('unhandledRejection', (reason, promise) => {
    if (reason instanceof Error) {
        errorHandler.handleError(reason);

        return;
    }
    console.error('Unknown Error: ', reason);
});

FCBot.start().then(x => {
    errorHandler.addLogger(new DiscordLogger());

    // cron.schedule('* * * * *', function() {
    //     console.log('running a task every minute');
    //     FCBot.client.channels.fetch(channel).then((channel) => (channel as TextChannel).send('Cron'));
    // });
    let cronConfig = {
        timezone: 'Europe/Warsaw',
    };
    cron.schedule('6 6 * * *', function() {
        console.log('Run daily roster check');
        let rosterWatcher = new RosterWatcher();
        rosterWatcher.checkDaily();
    }, cronConfig);

    cron.schedule('30 6 * * *', function() {
        console.log('Run daily role check');
        let gl = new Gl();
        gl.execute();
    }, cronConfig);

});
