import Debug from 'debug';
import { Command } from '../commons/Command'
import { CommandDefinition, CommandParameter, CommandArgument } from '../commons/command/'


const chalk = require('chalk');
const boxen = require('boxen');
const clear = require("clear");
const figlet = require("figlet");

const info = require("../package.json");

const debug = Debug("w:cli:commands:init");

@CommandDefinition({ 
    description: 'Show cli intro banner'
})
export class Readme extends Command  { 


    execute(yargs: any): void {
        debug(`Readme`)

        clear();

        console.log(
            chalk.green(
                figlet.textSync(`wand v${info.version}`, { horizontalLayout: "full", font: 'Flower Power' })
            )
        );
        
        //console.log(boxen(chalk.yellow(`After installation execute `) + chalk.red(`w init`)+ chalk.yellow(` to download core dependencies`), {padding: 1}));
        //console.log(chalk.green(`Execute `) + chalk.cyan(`w init`)+ chalk.green(` to complete instalation and download core dependencies`));
        // console.log("\n");
        // console.log("\n");

    }

}

export function register ():any {
    debug(`Registering....`)
    let command = new Readme();
    debug(`INIT: ${JSON.stringify(Object.getOwnPropertyNames(command))}`)

    return command.build()
}

