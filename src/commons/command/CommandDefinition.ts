import Debug from 'debug';
import 'reflect-metadata';

const debug = Debug("w:annotations:command:definition");

interface CommandDefinitionParameters {
    name?: string,
    description: string, 
    alias?: string,
    parent?: string,
    examples?: any[] 
}

export function CommandDefinition({name, description, alias = '', parent, examples=[]}: CommandDefinitionParameters) {
    debug(`CommandDefinition: DESCRIPTION: ${description}`)

    var args = arguments;

    return function ( target: Function) {
        debug(`CommandDefinition: CONTEXT: ${JSON.stringify(args[0])} TARGET: ${target.name}`);
        Reflect.defineMetadata("CommandDefinition", args[0], target);

        debug(`CommandDefinition: VALUE: ${JSON.stringify(Reflect.getMetadata("CommandDefinition", target))}`)
    }
}