
import Debug from 'debug';
import yargs, { Argv } from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';  
import * as utils from './commons/Utils'
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';
import { Execute } from './commons/Execute'

const cp = require("child_process");
const chalk = require('chalk');
const debug = Debug("w:cli:commands:cli");
const info = require("./package.json");
 
interface CliOptions {
    directories?: string[],
    scope?: string 
}

export class Root  { 

    static async init({directories = [ __dirname], scope}: CliOptions) {
        debug(`INIT`)

        if (info) {
            if (info.name) {
                scope = info.name.replace(/\/.*/,"");
            }
        }
        scope =  scope || '@chimpwizard'

        //Exception case
        if (scope == "@chimpwizards") {
            scope = "@chimpwizard"  //This should cover chimpwizard*
        }

        //CLI Tree structure
        let config: any = {}
        
        //Check node_modules in provided folders and global folder
        var additionalDirectories: string[] = []

        //Check global folder
        var folders = utils.findInstalledSpells(utils.getDefaultGlobalRoot(), scope);
        folders.forEach( (folder: string) => {
            additionalDirectories.push(folder);
        });

        for (const dir of directories) {  
            var folders = utils.findInstalledSpells(dir);
            folders.forEach( (folder: string) => {
                additionalDirectories.push(folder);
            });
        }

        for (const commandDir of additionalDirectories) {     
            debug(`CMD: ${commandDir}`)
            var bag = await this.addCommand(commandDir, config, "index.js");
            //config = _.merge({}, config, bag);
        }
        
        //Check Provided Folder
        for (const dir of directories) {     
            let folders = [
                //`./dist/commands`,  //For development purposes
                `${dir}/commands`,
            ];
            for (const commandDir of folders) {     
                debug(`CMD: ${commandDir}`)
                var bag = await this.addCommands(commandDir, config);
                //config = _.merge({}, config, bag);
            }
        }


        let author = info.author||'chimpwizard.com';
        yargs
            .scriptName("w")
            .usage("\nUsage: $0 <command>")
            .help()    
            .demand(1, "Must provide a valid command\n")
            .wrap(100)
            .epilogue(`(copyrigth) ${author} 2020`)
            .epilogue(`for more information, find our manual at ${info.homepage||''}`)
            .epilogue('\n')
            // .fail(function (msg, err, yargs) {
            //     if (err) throw err // preserve stack
            //     console.error('You broke it!')
            //     console.error(msg)
            //     console.error('You should be doing', yargs.help())
            //     process.exit(1)
            //   })
        
        ;

        Object.keys(config).sort().forEach( command => {
            if ( command == 'xxx' || command == 'shell') {
                debug(`XXX FOUND`)
            }            
            let commandDefinition: any = this.getCommandDefinition(config, command);
            debug(`ATTACHING ${command}`)

            yargs.command(commandDefinition);
    
        });
    
        //Parse
        yargs.argv
    }



    static async addCommand(commandDir: string, config: any, name: string, defaultParent?: string) {
        let filePath = path.resolve(path.join(commandDir, name));
        var ext = path.extname(filePath);
        if ((ext == '.js' || ext == '.ts') && name.indexOf(".d.ts")<0) {
        //if (ext == '.js') {
            //TODO: Replace hardcoded path
            var packageName = filePath.replace(".js","").replace(".ts","")

            if ( packageName.indexOf("spell-shell")>0) {
                debug(`PACKAGE FONUD`)
            }

            debug(`Loading ${packageName}`)

            try {
                var plugin;
                if (ext == '.js') {
                    plugin = require(packageName);
                } else {
                    plugin = await import(packageName)
                }

                if ( packageName.indexOf("spell-shell")>0) {
                    debug(`PACKAGE FONUD`)
                }    
                            
                var allPlugins =[]
                if(plugin['register'] != undefined) {
                    var definition = plugin.register();
                    allPlugins.push(definition)
                } else {
                    if ( packageName.indexOf("spell-config")>0) {
                        debug(`PACKAGE FONUD`)
                    }                    
                    var allofthem = _.values(plugin);
                    allofthem.forEach( (oneofthem: any) => {
                        if(oneofthem['register'] != undefined) {
                            var definition = oneofthem.register();
                            allPlugins.push(definition)
                        }

                    })
                }

                debug(`Registering ${packageName}`)
                for (var j = 0; j < allPlugins.length; j++){
                    var definition = allPlugins[j];

                    var parent = defaultParent || definition?.command?.parent;

                    if (parent && parent == 'shell') {
                        debug(`FOUND ${defaultParent||'root'}`)
                    }

                    if (parent) {
                        //Create a empty parent
                        if (!config[parent]) {
                            config[parent] = {
                                command: {
                                    name: parent,
                                    desc: parent
                                },

                            }
                        }

                        if (config[parent]) {
                            if (!config[parent].commands) {
                                config[parent].commands = {}
                            }
                            config[parent].commands[definition.command.name] = definition
                        }

                        definition.command.parent = parent;
                        definition.command.parentConfig = config;
                    } else {
                        config[definition.command.name]= definition;
                    }

                    //Search for subComponents
                    filePath = path.join(commandDir, definition.command.name);
                    if ( fs.existsSync(filePath)) {
                        var subComfing = config;
                        if (parent && config[parent]) {
                            subComfing = config[parent].commands;
                        }

                        var bagSubComand = await this.addCommands(filePath, subComfing, definition.command.name)

                        //config = _.merge({}, bagSubComand);

                    }
                }
            } catch (e) {
                debug(`${chalk.red("SOMETHING WHENT WRONG")}`)
                debug(e);
            }
            
        } else if (ext == '') {
            //Check if its a folder
            filePath = path.join(commandDir, name);
            if (utils.isDirectory(filePath)) {
                if (!config[name]) {
                    config[name] = {
                        name: name,
                        desc: name,
                        command: {
                            name: name,
                            description: `${_.startCase(name)} (multiple sub-commands)` ,
                            demand: 1
                        }
                    }
                }
                var subComfing = config;
                var bagSubComand = await this.addCommands(filePath, subComfing,name)
                //config = _.merge({}, bagSubComand);
            }
        }

        return config;
    }

    static async addCommands(commandDir: string, config: any, defaultParent?: string) {
        debug(`SEARCH FOR COMMANDS ${defaultParent||'root'}`)
        //var config = _.merge({}, bag);

        if ( fs.existsSync(commandDir)) {
            var files: string[] = fs.readdirSync(commandDir);
            for (const name of files) {         
                
                let filePath = path.resolve(path.join(commandDir, name));
                //let filePath = path.join(commandDir, name);
                debug(`PATH FOUND ${filePath}`)

                if ( fs.existsSync(filePath)) {
                    await this.addCommand(commandDir, config, name, defaultParent)
                }

            }


        }

        return config;

    }

    static addDummyArguments(config: any, command: string, allArgs: any) {
        debug(`COLLECTING ARGUMENTS ${command}`)

        let commandConfiguration: any = config[command];

        if (commandConfiguration.command.parent) {
            
            this.addDummyArguments(commandConfiguration.command.parentConfig, commandConfiguration.command.parent, allArgs)
            
            allArgs.push({name: "dummy", attr: "dummy"});
        }
    }

    static findParent(commandConfiguration: any, context: string[]) {
        var parents: string[] = context || []
        if ( commandConfiguration.command?.parent) {
            parents.push(commandConfiguration.command.parent)
            this.findParent(commandConfiguration.command.parentConfig, parents)            
        }

        return parents;
    }
    static getCommandDefinition(config: any, command: string) {
        if ( command == 'xxx' || command == 'shell') {
            debug(`FOUND`)
        }  
        let commandConfiguration = config[command];
        debug(`BUILDING DEFINITION ${command}`)
        if (!commandConfiguration) {
            return {};
        }
        var commandDefinition: any = {
            command: commandConfiguration.command?.name, 
            aliases: commandConfiguration.command?.aliases, 
            desc: commandConfiguration.command?.description, 

            builder:  (yargs: any) => {
                
                debug(`*** BUILDING command ${commandConfiguration.command.name}`)

                if (commandConfiguration.command.name == "xxx" || commandConfiguration.command.name == "sample") {
                    debug(`FOUND ${commandConfiguration.command.name}`)
                }

                let param = yargs["_"]

                let possitional = '';
                if(commandConfiguration.args) {
                    debug(`CONFIGURE COMMAND ARGUMENTS: ${JSON.stringify(commandConfiguration.args)}`)
                    commandConfiguration.args.forEach( (arg: any) => {
                        possitional += (possitional.length>0?' ':'') + (arg.required?'<':'[') + arg.name + (arg.required?'>':']')
                    });
                }
                
                var parentList = this.findParent(commandConfiguration, [commandConfiguration.command.name])
                var cmd = parentList.reverse().join(' ')
                commandConfiguration['usage'] = `${cmd} ${possitional}`
                yargs
                    .usage(`\nUsage: $0 ${cmd} ${possitional} [options]`)
                    .help()   
                ;

                if(commandConfiguration.command.demand) {
                    yargs.demand(commandConfiguration.command.demand, "Must provide a valid command")
                }

                commandConfiguration.command.examples?.forEach( (example: any) => {
                    yargs.example(`$0 ${example[0]}`,`${example[1]}`);
                });


                if(commandConfiguration.args) {
                    debug(`CONFIGURE COMMAND ARGUMENTS: ${JSON.stringify(commandConfiguration.args)}`)
                    var requiredArgiments: any[] = []
                    commandConfiguration.args.forEach( (arg: any) => {
                        //yargs.positional(arg.name, arg.definition)
                        yargs
                            .positional(arg.name, arg.definition)
                        
                        if (arg.required) {
                            requiredArgiments.push(arg.name);
                        }
                    });

                    //TODO: It is not working
                    if (requiredArgiments.length>0) {
                        //yargs.demandArgument(requiredArgiments); //TODO: Handle this automatically
                        commandConfiguration['demandArgument'] = requiredArgiments;
                    }
                }
                
                debug(`CONFIGURE COMMAND OPTIONS: ${JSON.stringify(commandConfiguration.options)}`)
                if( commandConfiguration.options) {
                    var requiredArgiments: any[] = []
                    commandConfiguration.options.forEach( (option: any) => {
                        debug(`CONFIGURE COMMAND OPTIONS: DEFINITION: ${JSON.stringify(option.definition)}`)
                        yargs.option(option.name , option.definition)

                        if (option.name  == "release") {
                            debug(`FOUND ${option.name }`)
                        }
                        if (option.defaults != undefined) {
                            yargs.default(option.name , option.defaults)
                        }
                        if (option.required) {
                            requiredArgiments.push(option.name);
                        }
                    });   

                    if (requiredArgiments.length>0) {
                        yargs.demandOption(requiredArgiments);
                    }
                }
                

                //Subcomands to parent
                // yargs.command('xxx', 'create a new xxx', function (yargs: any) {
                //   console.log('creating project :)')
                // })
                if (commandConfiguration.commands) {
                    Object.keys(commandConfiguration.commands).sort().forEach( subcommand => {
                        let subCommandDefinition: any = this.getCommandDefinition(commandConfiguration.commands, subcommand);
                        if(subCommandDefinition) {
                            yargs.command(subCommandDefinition);
                        }
                    });
                }

            },

            handler: (yargs: any) => {
                debug(`HANDLER.... ${JSON.stringify(yargs)}`)
                let instance = commandConfiguration.executer;

                for (let [key, value] of Object.entries(yargs)) {
                  debug(`YARGS HAS: ${key}=> ${value}`)
                    
                  if (instance) {

                    //If the key is not in the options then it is an argument
                    if ( Reflect.has(instance, key) && commandConfiguration.args.filter((x: { name: string; }) => x.name == key).length==0 ) {
                        debug(`MAP INSTANCE: ${key}=> ${value}`)
                        Reflect.set(instance, key, value);
                    } else if ( key == "_") {
                        debug(`MAPING ARGUMENTS: ${JSON.stringify(commandConfiguration.args)}`)

                        var allArgs: any = []
                        
                        //Add dummy entires to consider all parent attributes positions
                        this.addDummyArguments(config, command, allArgs);

                        commandConfiguration.args.forEach((arr: any) => {
                            if ( allArgs.filter( (x: { name: any; }) => x.name == arr.name).length == 0 ) {
                                allArgs.push(arr);
                            }
                        })

                        allArgs.forEach( (arg: any, i: number) => {
                            if ( Reflect.has(instance, arg.attr) ) {
                                var arr: string[] = value as string[];
                                if (arr.length> (i+1)) {
                                    debug(`MAP ARG2: ${arg.name} => ${arr[i+1]}`)
                                    Reflect.set(instance, arg.attr, arr[i+1]);
                                    debug(`INSTANCE IS1 ${JSON.stringify(instance)}`)
                                }
                            }
                        });
                    }
                  }
                }

                if (instance) {
                    debug(`BEFORE EXECUTE ----------------- `)
                    debug(`YARGS ${JSON.stringify(instance)}`)

                    //TODO: Verify required Arguments
                    var missing = [];
                    if ( commandConfiguration.demandArgument) {
                        for(var j=0; j < commandConfiguration.demandArgument.length; j++) {
                            var requiredArgument = commandConfiguration.demandArgument[j]
                            if (!instance[requiredArgument]) {
                                missing.push(requiredArgument)
                            }
                        };
                    }
                    if (missing.length==0) {
                        instance.execute(yargs)
                    } else {
                        // const executer = new Execute();
                        // let cmd = `w ${commandConfiguration.usage} --help`;
                        // executer.run({cmd: cmd, showLog: false})    
                        console.log(`Missing argument [${missing.join(",")}]`)
                    }
                    debug(`AFTER EXECUTE ----------------- `)
                }
            }
        }

        return commandDefinition;
    }

}

