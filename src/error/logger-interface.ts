import {Color} from "../utils/color";

export const ERROR_CUSTOM_LEVELS = {
    levels: {
        trace: 5,
        debug: 4,
        info: 3,
        warn: 2,
        error: 1,
        fatal: 0,
    },
    colors: {
        trace: Color.DEFAULT,
        debug: Color.GREEN,
        info: Color.GREEN,
        warn: Color.ORANGE,
        error: Color.RED,
        fatal: Color.RED,
    },
};

export interface LoggerInterface {
    debug(msg: any, meta?: any): void;
    log(msg: any, meta?: any): void;
    error(msg: any, meta?: any): void;
    trace(msg: any, meta?: any): void;
    warn(msg: any, meta?: any): void;
}
