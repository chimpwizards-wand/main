
import Debug from 'debug';
import yargs, { Argv } from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';  
import * as utils from './commons/Utils'
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';
import { Execute } from './commons/Execute';
import { Config } from './commons/Config';

const cp = require("child_process");
const chalk = require('chalk');
const debug = Debug("w:cli:commands:cli:root");
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

        debug(`AUTHOR: ${JSON.stringify(info.author)}`)
        yargs
            .scriptName("w")
            .usage("\nUsage: $0 <command>")
            .help()    
            .demand(1, "Must provide a valid command\n")
            .wrap(130)
            .epilogue(`(copyrigth) ${info.author.name||'chimpwizard.com'} 2020`)
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
            let commandDefinition: any = this.getCommandDefinition(config, command);
            debug(`ATTACHING ${command}`)

            yargs.command(commandDefinition);
    
        });
    
        //Parse
        yargs.argv
    }


    static findOrCreateParentConfigTree(parents: string, config: any) {
        //debug(`findOrCreateParentConfigTree`)
        // if (parents == 'api:petstore:get') {
        //     debug(`FOUND`)
        // }           
        var parentConfig: any = config;
        var allParents:any = parents.split(":");
        var i = 0;
        for (let parent of allParents) {
            //debug(`Going to find ${parent}`)
            if (!parentConfig) {
                debug(`SOMETING WENT WRONG`)
            }
            var found: any = this.findOrCreateParentConfig(parent, parentConfig);
            //debug(`found`)
            i++;
            if (i < allParents.length) {
                found.commands=found.commands || [];
                parentConfig = found.commands;
                
            } else {
                parentConfig = found;
            }           

        }
        return parentConfig;
    }

    static findOrCreateParentConfig(parent: string, config: any) {
        //debug(`findOrCreateParentConfig`)
        // if (parent == 'petstore') {
        //     debug(`FOUND`)
        // }           
        var parentConfig: any = this.findParentConfig(parent, config)
        //Create a empty parent
        if (!parentConfig) {
            config[parent] = {
                command: {
                    name: parent,
                    description: parent,
                    aliases: parent.charAt(0),
                },
                commands: [],
            }
            parentConfig=config[parent];
        }        

        return parentConfig;
    }

    static findParentConfig(parents: string, config: any) {
        //debug(`findParentConfig`)
        // if(parents.indexOf(":")>0) {
        //     debug('found')
        // }

        var allParents:any = parents.split(":");
        var i = 0;
        var parentConfig: any;
        for (let parent of allParents) {
            //debug(`Looking for ${parent}`)
            for(var the1 in config) {
                var theone: any = config[the1];
                if ( theone.command.name == parent ) {
                    parentConfig= theone;
                } else {
                    if ( theone.commands && Object.keys(theone.commands).length > 0) {
                        parentConfig= this.findParentConfig(parent, theone.commands)
                    }
                }

                if (parentConfig) break;
            }
        }


        //add commands collection if doesnt exists
        if(parentConfig) {
            parentConfig.commands = parentConfig.commands || {}
        }

        return parentConfig;
    }

    static async addCommand(commandDir: string, config: any, name: string, defaultParent?: string) {
        debug(`addCommand ${commandDir}`)
        let filePath = path.resolve(path.join(commandDir, name));
        var ext = path.extname(filePath);
        if ((ext == '.js' || ext == '.ts') && name.indexOf(".d.ts")<0) {
            //TODO: Replace hardcoded path
            var packageName = filePath.replace(".js","").replace(".ts","")

            // if ( packageName.indexOf("spell-workspace")>0) {
            //     debug(`PACKAGE FONUD`)
            // }

            debug(`Loading ${packageName}`)

            try {
                var plugin;
                if (ext == '.js') {
                    plugin = require(packageName);
                } else {
                    plugin = await import(packageName)
                }

                if ( packageName.indexOf("spell-workspace")>0) {
                    debug(`PACKAGE FONUD`)
                }    
                            
                var allPlugins =[]
                if(plugin['register'] != undefined) {
                    var definition1 = plugin.register();
                    allPlugins.push(definition1)
                } else {
                    if ( packageName.indexOf("spell-api")>0) {
                        debug(`PACKAGE FONUD`)
                    }                    
                    var allofthem = _.values(plugin);
                    allofthem.forEach( (oneofthem: any) => {
                        if(oneofthem['register'] != undefined) {
                            var definition2 = oneofthem.register();
                            allPlugins.push(definition2)
                        }

                    })
                }


                //debug(`Registering ${packageName}`)
                for (let definition of allPlugins){
                    var parent: any = defaultParent || definition?.command?.parent;



                    if (parent) {

                        if(!config) {
                            debug(`SOMETHIGN WENT WRONG`)
                        }
                        var parentConfig: any = this.findOrCreateParentConfigTree(parent, config)

                        // if (definition.command.name == 'import') {
                        //     debug(`FOUND`)
                        // }                        
                        if (parentConfig) {
                            parentConfig.commands[definition.command.name] = definition
                        }

                        definition.command.parent = parent;
                        definition.command.parentConfig = config;
                    } else {
                        config[definition.command.name]= definition;
                    }

                    //Search for subComponents
                    filePath = path.join(commandDir, definition.command.name);
                    if ( fs.existsSync(filePath)) {
                        var parentConfig2: any = this.findParentConfig(parent, config)

                        var subComfing = config;
                        if (parent && parentConfig2) {
                            subComfing = parentConfig2.commands;
                        }

                        await this.addCommands(filePath, subComfing, definition.command.name)

                    }
                }
                debug(`End Cicle`)
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

            }
        }

        return config;
    }

    static async addCommandsFromConfig(config: any){
        debug(`addCommandsFromConfig`)
        //Add extra commans from .wand/config
        const wandConfig = new Config();
        if (wandConfig.inContext({dir: process.cwd()})) {
            const wandContext = wandConfig.load({})
            wandContext.commands = wandContext.commands || {}
            wandContext.commands.api = wandContext.commands.api || [];
            for (const key in wandContext.commands.api) {
                var wandCommand = wandContext.commands.api[key];
                debug(`Registering ${wandCommand.name}`)
                try {
                    var instance = await import(wandCommand.config.handler)
                    

                    const parser = new instance.Define()
                    const metadata:any = await parser.getPlugins(wandCommand.name);
                    for (let m in metadata) {
                        let commandConfiguration: any = metadata[m];
                        debug(`Registering ${commandConfiguration.command.name}`)

                        var handler = new instance.Handler()
                        const newHandler = Object.assign(handler, {name: wandCommand.name});

                        commandConfiguration['executer'] = newHandler;
                        //allPlugins.push(commandConfiguration)
                        var parent = commandConfiguration.command.parent || 'api' 


                        // if (parent == "api:petstore:get" && commandConfiguration.command.name=='pet') {
                        //     debug('found')
                        // }                             

                        var parentConfig: any = this.findOrCreateParentConfigTree(parent, config)
                        if (parentConfig) {
                            if(parentConfig.commands[commandConfiguration.command.name] ) {
                                _.mergeWith(parentConfig.commands[commandConfiguration.command.name],commandConfiguration, (objValue: any, srcValue: any)=>{
                                    if (_.isArray(objValue)) {
                                        return objValue.concat(srcValue);
                                      }
                                });

                            } else {
                                parentConfig.commands[commandConfiguration.command.name] = commandConfiguration
                            }
                            
                        }
                        commandConfiguration.command.parent = parent;
                        commandConfiguration.command.parentConfig = parentConfig;
                      
                            
                    }

                    debug(`Handler`)
                } catch (e) {
                    debug(`${chalk.red("SOMETHING WHENT WRONG")}`)
                    debug(e);
                    debug(`error`)
                }
            }
        }        
        debug(`Done`)
    }
    static async addCommands(commandDir: string, config: any, defaultParent?: string) {
        debug(`SEARCH FOR COMMANDS ${defaultParent||'root'}`)

        //Search for plugins in dick
        if ( fs.existsSync(commandDir)) {
            var files: string[] = fs.readdirSync(commandDir);
            for (const name of files) {         
                
                let filePath = path.resolve(path.join(commandDir, name));

                debug(`PATH FOUND ${filePath}`)

                if ( fs.existsSync(filePath)) {
                    await this.addCommand(commandDir, config, name, defaultParent)
                }
            }
        }

        //search for plugins in .wand/config file
        await this.addCommandsFromConfig(config)

        return config;

    }

    static addDummyArguments(config: any, command: string, allArgs: any) {
        debug(`COLLECTING ARGUMENTS ${command}`)

        //let commandConfiguration: any = this.findParentConfig(command,config)
        let commandConfiguration: any = config[command]; //.command.parentConfig;

        // if ( command == 'registry' ){
        //     debug(`FOUND`)
        // } 


        if(!commandConfiguration || !commandConfiguration.command) {
            debug(`SOMETHING WHENT WRONG`)
        }

        if (commandConfiguration?.command?.parent) {
            
            //this.addDummyArguments(commandConfiguration.command.parentConfig.commands, commandConfiguration.command.name, allArgs)
            this.addDummyArguments(commandConfiguration.command.parentConfig, commandConfiguration.command.parent, allArgs)
            
            allArgs.push({name: "dummy", attr: "dummy"});
        }
    }

    static findParent(commandConfiguration: any, context: string[]) {
        var parents: string[] = context || []
        if ( commandConfiguration.command?.parent) {
            var parent:string = commandConfiguration.command.parent;
            var last = parent.split(':').reverse()[0]

            parents.push(last)
            this.findParent(commandConfiguration.command.parentConfig, parents)            
        }

        return parents;
    }

    static findParentNEW(commandConfiguration: any, context: string[]) {
        var parents: string[] = context || []
        if ( commandConfiguration.command?.parent) {
            var parent:string = commandConfiguration.command.parent;

            parents.push(parent)
            this.findParent(commandConfiguration.command.parentConfig, parents)            
        }

        return parents;
    }


    static getCommandDefinition(config: any, command: string) {
        // if ( command == 'namespace' || command == 'registry') {
        //     debug(`FOUND`)
        // }  
        let commandConfiguration = config[command];
        debug(`BUILDING DEFINITION ${command}`)
        if (!commandConfiguration) {
            return {};
        }
        var commandDefinition: any = {
            command: commandConfiguration.command?.name, 
            aliases: commandConfiguration.command?.aliases, 
            desc: commandConfiguration.command?.description, 
            parent: commandConfiguration.command?.parent, 
            parentConfig: commandConfiguration.command?.parentConfig, 

            builder:  (yargs: any) => {
                
                debug(`*** BUILDING command ${commandConfiguration.command.name}`)

                // if (commandConfiguration.command.name == "xxx" || commandConfiguration.command.name == "new") {
                //     debug(`FOUND ${commandConfiguration.command.name}`)
                // }

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
                        // if ( option.definition == "ID of pet to return") {
                        //     debug('found');
                        // }
                        //option.definition.type='string'
                        yargs.option(option.name , option.definition)

                        // if (option.name  == "release") {
                        //     debug(`FOUND ${option.name }`)
                        // }
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
                        if (subcommand != '') {
                            let subCommandDefinition: any = this.getCommandDefinition(commandConfiguration.commands, subcommand);
                            if(subCommandDefinition) {
                                yargs.command(subCommandDefinition);
                            }
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

                    if ( Reflect.has(instance, key) && commandConfiguration.options.filter((x: { name: string; }) => x.name == key).length>0 ) {
                        debug(`MAP INSTANCE: ${key}=> ${value}`)
                        if (value) Reflect.set(instance, key, value);
                    } else if ( Reflect.has(instance, key) && commandConfiguration.args.filter((x: { name: string; }) => x.name == key).length==0 ) {
                        debug(`MAP INSTANCE: ${key}=> ${value}`)
                        if (value) Reflect.set(instance, key, value);
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
                        for(let requiredArgument of commandConfiguration.demandArgument) {
                            if (!instance[requiredArgument]) {
                                missing.push(requiredArgument)
                            }
                        };
                    }
                    if (missing.length==0) {
                        const newInstance = Object.assign(instance, {context: commandConfiguration});

                        newInstance.execute(yargs)
                        //instance['context'] = commandConfiguration;
                    } else {
                        // const executer = new Execute();
                        // let cmd = `w ${commandConfiguration.usage} --help`;
                        // executer.run({cmd: cmd, showLog: false})    
                        console.log(chalk.red(`Missing argument [${chalk.cyan(missing.join(","))}]`))
                    }
                    debug(`AFTER EXECUTE ----------------- `)
                }
            }
        }

        if (!commandDefinition) {
            debug(`Something wrong happens...`)
        }

        return commandDefinition;
    }

}

