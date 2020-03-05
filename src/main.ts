import "reflect-metadata";
import { FCBot } from './FCBot';
import { config } from 'dotenv';

console.log(process.env.NODE_ENV);

if (process.env.NODE_ENV && process.env.NODE_ENV === 'dev') {
    config({ path: __dirname + `/../.env.dev`});

} else {
    config();

}


FCBot.start();

