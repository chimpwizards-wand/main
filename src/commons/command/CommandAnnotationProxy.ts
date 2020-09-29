import Debug from 'debug';
import 'reflect-metadata';
import { CommandParameter } from './CommandParameter';
import { CommandDefinition} from './CommandDefinition';
import { CommandArgument } from './CommandArgument';

const debug = Debug("w:annotations:command:annotation:proxy");

export function CommandAnnotationProxy(...args: any[]) {
    debug(`CommandAnnotationProxy: ARGS LENGTH: ${args.length}`)

    switch (args.length) {

        case 3: // can be method or parameter decorator
            var target = args[0] as Function;
            var key = args[1] as string;
            var descriptor = args[2] as PropertyDescriptor;

            debug(`CommandArgument: CONTEXT: ${JSON.stringify(args)} TARGET: ${target} KEY: ${key} DESCRIPTOR: ${JSON.stringify(descriptor)}`);
            Reflect.defineMetadata("CommandArgument", args, target, key);
            debug(`CommandArgument: VALUE: ${JSON.stringify(Reflect.getMetadata("CommandArgument", target, key))}`)
            // var originalMethod = descriptor.value;
            // descriptor.value = function() {
            //     var context = this
            //     var args = arguments;
            //     originalMethod.apply(context, args);
            // };
            //return descriptor;

        case 2: // property decorator
            var target = args[0] as Function;
            var key = args[1] as string;
            debug(`CommandParameter: CONTEXT: ${JSON.stringify(args)} TARGET: ${JSON.stringify(target)} KEY: ${key}`);
            Reflect.defineMetadata("CommandParameter", args, target, key);
            debug(`CommandParameter: VALUE: ${JSON.stringify(Reflect.getMetadata("CommandParameter", target, key))}`)

        case 1: // class decorator
            var target = args[0] as Function;
            debug(`CommandDefinition: CONTEXT: ${JSON.stringify(args)} TARGET: ${target.name}`);
            Reflect.defineMetadata("CommandDefinition", args, target);
            debug(`CommandDefinition: VALUE: ${JSON.stringify(Reflect.getMetadata("CommandDefinition", target))}`)

    //     default: // invalid size of arguments 
    //         throw new Error('Not a valid decorator');
    }    


}