import Debug from 'debug';
import { Command } from '../commons/Command'
import { CommandDefinition, CommandParameter, CommandArgument } from '../commons/command/'
import { Execute } from '../commons/Execute'

const info = require("../package.json");
const progress = require('cli-progress');
const chalk = require('chalk')

const debug = Debug("w:cli:commands:init");

@CommandDefinition({ 
    description: 'Initialize CLI', 
    alias: 'i',
    examples: [
        [`init --force`, `Force initialization for all settings`],
        [`init --release 1.2`, `Install specific version of the cli`],
        [`init --no-global`, `Install CLI locally into your folder project`],
    ]
})
export class Init extends Command  { 

    @CommandParameter({ description: 'Install globally', alias: 'g', defaults: true})
    global: boolean = true;

    @CommandParameter({ description: 'Force to install/override if exists', alias: 'f', defaults: false})
    force: boolean = false;

    @CommandParameter({ description: 'Show logging execuion in console', alias: 'v', defaults: false})
    verbose: boolean = false;

    @CommandParameter({ description:'Install a specific release/version', defaults: 'latest', alias: 'r'})
    release: string = 'latest';

    @CommandParameter({ description:'Specify package scope to use', defaults: '@chimpwizards-wand', alias: 's'})
    scope: string = '@chimpwizards-wand';

    @CommandParameter({ description:'Specify package scope where the spells are located', defaults: '@chimpwizards-wand', alias: 't'})
    scopeFrom: string = '@chimpwizards-wand';


    getSpells() {
        //
        // List of most used core spells
        //
        let spells: string[] = [
            "spell-config",
            "spell-shell",
            "spell-spells",
            "spell-workspace"
        ];
        return spells
    }

    execute(yargs: any): void {
        debug(`Installing dependencies`)
        const exec = new Execute();

        const bar = new progress.SingleBar({
            format: 'Installing core dependencies |' + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total} Spells || Installing: {spell}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });

        bar.start(this.getSpells().length, 0, {
            spell: "N/A"
        });

        this.getSpells().forEach( x => {

            // let scope = this.scope;
            // if (info) {
            //     if (info.name) {
            //         scope = info.name.replace(/\/.*/,"");
            //     }
            // }

            debug(`Spells scope" ${this.scopeFrom}`)
            let name = `${this.scopeFrom}/${x}`;

            //npm i @chimpwizard/commons@npm:@chimpwizard-3.3/commons
            debug(`EXECUTING: npm ${this.force?"--force":""} ${this.global?"--global":""}  install ${(this.scope==this.scopeFrom)?name:name+"@npm:"+this.scope+'/'+x}${(this.release=="latest")?"":"@"+this.release}`)
            try {
                exec.run( {
                    cmd: `npm ${this.force?"--force":""} ${this.global?"--global":""}  install ${(this.scope==this.scopeFrom)?name:name+"@npm:"+this.scope+'/'+x}${(this.release=="latest")?"":"@"+this.release}`,
                    output: this.verbose
                })
            } catch(e) {
                debug(`ERROR: ${e}`)
            }

            bar.increment({spell: x});
        });

        bar.stop();
    }

}

export function register ():any {
    debug(`Registering....`)
    let command = new Init();
    debug(`INIT: ${JSON.stringify(Object.getOwnPropertyNames(command))}`)

    return command.build()
}

