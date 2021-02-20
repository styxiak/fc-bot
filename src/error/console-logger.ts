import {LoggerInterface} from "./logger-interface";

export class ConsoleLogger implements LoggerInterface{


    debug(msg: any, meta?: any) {
        console.debug(msg, meta);
    }

    log(msg: any, meta?: any) {
        console.log(msg, meta);
    }

    error(msg: any, meta?: any) {
        console.error(msg, meta);
    }

    trace(msg: any, meta?: any) {
        console.trace(msg, meta);
    }

    warn(msg: any, meta?: any) {
        console.warn(msg, meta);
    }

}
