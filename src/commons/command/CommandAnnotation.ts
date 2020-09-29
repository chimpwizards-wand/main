import Debug from 'debug';
import 'reflect-metadata';
import { CommandAnnotationProxy } from './CommandAnnotationProxy';

const debug = Debug("w:annotations:command:annotation");

export function CommandAnnotation(...args: any[]) {
    debug(`CommandAnnotation: ARGS: ${args}`)
    
    return CommandAnnotationProxy;
    
}
