import Debug from 'debug';
import { Command } from '../commons/Command'
import { Execute } from '../commons/Execute'
import { CommandDefinition, CommandParameter, CommandArgument } from '../commons/command/'

const chalk = require('chalk');
const debug = Debug("w:cli:config:import");

@CommandDefinition({ 
    description: 'Import configuration from lerna or meta',
    parent: 'xxx',
    examples: [
        [`xxx Sample lerna.json`, `Create the configuration based on a lerna.json file`],
        [`xxx Sample .meta`, `Create the configuration based on a .meta file`],        
    ]    
})
export class Sample extends Command  { 

    @CommandArgument({ description: 'Metadata file to use to import into this workspace', required: true})
    from: string = '';

    @CommandParameter({ description: 'Option', required: true})
    option: string = '';

    execute(yargs: any): void {
        debug(`FROM ${this.from}`)

        // if (!this.from || this.from.length==0) {
        //     console.log(`Missing argiment from`)         
        // }
        console.log(`FROM ${chalk.green(this.from)} !!!`)
    }

}

export function register ():any {
    debug(`Registering....`)
    let command = new Sample();
    debug(`INIT: ${JSON.stringify(Object.getOwnPropertyNames(command))}`)

    return command.build()
}

