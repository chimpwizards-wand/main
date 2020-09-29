import Debug from 'debug';
import 'reflect-metadata';
import * as _ from 'lodash';  
import {Init} from '../../commands/Init'
const debug = Debug("w:annotations:command:parameter");

interface CommandArgumentParameters {
    description: string, 
    required?: boolean,
    name?: string
}

export function CommandArgument({description, required = false, name}: CommandArgumentParameters) {
    debug(`CommandArgument: ${description}`)

    var args = arguments;
    
    return function ( target: any, key: string ) {
        debug(`CommandArgument: CONTEXT: ${JSON.stringify(args[0])} TARGET: ${target} KEY: ${key} VALUE: ${target[key]}`);
        
        //console.log(target.constructor)
        // var instance = target.constructor({})
        // console.log(instance)
        // console.log(Object.getOwnPropertyNames(target))


        Reflect.defineMetadata("CommandArgument", args[0], target.constructor, key);

        debug(`CommandArgument: VALUE: ${JSON.stringify(Reflect.getMetadata("CommandArgument", target.constructor, key))}`)

    }
}