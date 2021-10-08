
import Debug from 'debug';
import 'reflect-metadata';

const debug = Debug("w:cli:commands");

export abstract class Command  {

  commandConfiguration: any = {
    command: {},
    args: [],
    options: []
  }

  constructor() {
    debug(`Command()`)
  }


  build() {

    let commandConfiguration: any = {
      command: {},
      args: [],
      options: [],
      executer: () => {}
    }

    const instance = this.constructor({})
    let command = Reflect.getMetadata("CommandDefinition", this.constructor)

    commandConfiguration.command.name = command.name?command.name:this.constructor.name.toLowerCase()
    debug(`ATTACHING Command... ${commandConfiguration.command.name}`)
    //debug(`TYPE: ${this.constructor.name}`)

    commandConfiguration.executer = instance;
      
    let params= Object.getOwnPropertyNames(this);
    //debug(`ATTACH PARAMS: ${JSON.stringify(params)}`)

    params.forEach( (x: string) => {

      //Check if parameters exists
      let p = Reflect.getMetadata("CommandParameter", this.constructor, x)
      if (p) {
        //debug(`ATTACH PARAMS: PARAM: ${x} = ${instance[x]} DEFINITION: ${JSON.stringify(p)}`)
        if (!(instance[x] instanceof Object)) {
          //ctx.option(x, {description: p[0], type: typeof(instance[x])})

          //Add a Parameter into the command configuration eg.. --from
          commandConfiguration.options.push( {
            attr: x,
            name: p.name || x,
            definition: {description: p.description, type: typeof(instance[x]), alias: p.alias},
            defaults: p.defaults,
            required: p.required,
            whatIsThis: 'option'
          })
        }
      } 

      //Check if argument exists
      let a = Reflect.getMetadata("CommandArgument", this.constructor, x)
      if (a) {
        //debug(`ATTACH ARGUMENT: ARG: ${x} = ${instance[x]} DEFINITION: ${JSON.stringify(a)}`)

        //Add an positional argument to the command configuration eg. import <from> or import [from]
        if (!(instance[x] instanceof Object)) {
          commandConfiguration.args.push( {
            attr: x,
            name: a.name || x,
            definition: {description: a.description, type: typeof(instance[x]), default: instance[x]?.length>0?instance[x]:undefined},
            required: a.required,   
            whatIsThis: 'arg'
          })
        }
      }
      
    });


    // Create command
    debug(`CONFIGURE COMMAND DEFINITION: ${JSON.stringify(command)}`)
    commandConfiguration.command = {
      name: command.name?command.name:this.constructor.name.toLowerCase(),
      aliases: command.alias?[command.alias]:[],
      description: command.description,
      examples: command.examples, 
      parent: command.parent,
    }

    debug(`CONFIGURE COMMAND ARGS: ${JSON.stringify(commandConfiguration.args)}`)

    return commandConfiguration;

  }
  static register (yargs: any):any {
      debug(`Registering....`)
      let command = this.constructor();
      debug(`INIT: ${JSON.stringify(Object.getOwnPropertyNames(command))}`)

      command.attach(yargs);
  }

  abstract execute(yargs: any): void;
  // execute(yargs: any): void {
  //   debug(`Nothing to do`)

  // }
}



/*
 REFEREMCE:
  - https://codeburst.io/decorate-your-code-with-typescript-decorators-5be4a4ffecb4
  - https://medium.com/@rossbulat/get-started-with-typescript-decorators-cf3924c37f04
  - https://dev.to/scleriot/typescript-method-decorators-example-1imc
  - https://stackoverflow.com/questions/51170130/check-if-property-is-decorated-with-specific-annotation-typescript
  - http://blog.wolksoftware.com/decorators-metadata-reflection-in-typescript-from-novice-to-expert-part-4
  - https://blog.wizardsoftheweb.pro/typescript-decorators-reflection/
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name
  - https://stackoverflow.com/questions/31169259/how-to-debug-typescript-files-in-visual-studio-code
  - https://www.csgpro.com/blog/2016/08/typescript-default-parameters-and-destructuring-as-a-substitute-for-named-parameters/
*/