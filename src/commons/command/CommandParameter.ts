import Debug from 'debug';
import 'reflect-metadata';
import * as _ from 'lodash';  
import {Init} from '../../commands/Init'
const debug = Debug("w:annotations:command:parameter");

interface CommandParameterParameters {
    description: string, 
    alias?: string,
    defaults?: any,      //NOTE: Needs to be in plural due reserved language words
    name?: string,
    required?: boolean
}

export function CommandParameter({description, defaults, alias = '', name, required = false}: CommandParameterParameters) {
    debug(`CommandParameter: ${description}`)

    var args = arguments;
    
    return function ( target: any, key: string ) {
        debug(`CommandParameter: CONTEXT: ${JSON.stringify(args[0])} TARGET: ${target} KEY: ${key} VALUE: ${target[key]}`);
        
        Reflect.defineMetadata("CommandParameter", args[0], target.constructor, key);

        debug(`CommandParameter: VALUE: ${JSON.stringify(Reflect.getMetadata("CommandParameter", target.constructor, key))}`)

    }
}