import Debug from 'debug';
import 'reflect-metadata';

const debug = Debug("w:annotations:command:argument");

export function CommandAction(description: string) {
    debug(`CommandAction: DESCRIPTION: ${description}`)

    var args = arguments;
    
    return function ( target: any, key: string, descriptor: PropertyDescriptor ) {

        debug(`CommandAction: CONTEXT: ${JSON.stringify(args)} TARGET: ${target} KEY: ${key} DESCRIPTOR: ${JSON.stringify(descriptor)}`);

        Reflect.defineMetadata("CommandAction", args, target, key);

        debug(`CommandAction: VALUE: ${JSON.stringify(Reflect.getMetadata("CommandAction", target, key))}`)

        // var originalMethod = descriptor.value;

        // descriptor.value = function() {
        //     var context = this
        //     var args = arguments;
        //     originalMethod.apply(context, args);
        // };
        return descriptor;

    }
}
