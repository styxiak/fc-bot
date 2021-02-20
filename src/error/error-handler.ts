import {LoggerInterface} from "./logger-interface";
import {ConsoleLogger} from "./console-logger";
import {DiscordLogger} from "./discord-logger";

export class ErrorHandler {
    private loggers: LoggerInterface[] = [];

    constructor() {
        this.loggers.push(new ConsoleLogger());
    }

    addLogger(logger: LoggerInterface) {
        this.loggers.push(logger);
    }

    async handleError(err: Error): Promise<void> {
        await this.loggers.forEach(logger => logger.error(err));
        // await sendMailToAdminIfCritical();
        // await sendEventsToSentry();
    }

}
