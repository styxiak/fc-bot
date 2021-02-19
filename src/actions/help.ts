import { AbstractCommand, OptionDefinition, UsageDefinition } from '../abstract-command';
import { Message } from 'discord.js';

export class Help extends AbstractCommand {

    protected readonly prefix = 'help';
    protected readonly optionsDefinition: OptionDefinition[] = [];
    protected readonly usageDefinition: UsageDefinition[] = [
        {
            header: 'x',
            description: 'Jestem super botem który wiele potrafi i robi bla bla bla...'
        },
        {
            header: 'Dostępne komendy',
            content: '**ping** - pinguje bota\n' +
                '**mentions**, **m** - zarządza spoamowaniem wzmiankami\n' +
                '**embed** - umieszcza ładne ogłoszenia\n' +
                '**discord** - sprawdzenie poprawności ról na discord\n' +
                '**guild** - zbiór komend do zarządzania rolami w gildii'
        },
        {
            header: 'Więcej informacji',
            content: '`!m -h` pokaże opcje dla komendy `!m`'
        },
        {
            header: 'Kontakt',
            content: 'Błędy, pomysły proszę zgłaszać do @Styx'
        }
    ];

    constructor(message: Message) {
        super(message);
    }

    execute(): void {
        this.showUsage();
    }

}
