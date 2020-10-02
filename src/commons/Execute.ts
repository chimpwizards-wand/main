import Debug from 'debug';
import * as path from 'path';
import * as cp from 'child_process';
import * as _ from 'lodash';  
import { Config } from './Config';

//import * as chalk from 'chalk'
const chalk = require('chalk')

const debug = Debug("w:cli:execute");

interface ExecuteCommand {
  folder?: string, 
  label?: string,
  cmd: string, 
  output?: boolean,
  showLog?: boolean
}

export class Execute  {

  constructor() { }


  loop({cmd} : ExecuteCommand) {
    debug(`Executing ${cmd}...`);

    var model = new Config()
    var config = model.load({});
    
    //Run it on solution
    this.run({folder: process.cwd(), cmd: cmd})

    //Run it on each component
    if (config) {
      _.each(config.components||[], (component, name) => {
          var folder = path.join(config.path,component.name);
          this.run({folder: folder, cmd:cmd})
      });
    } 
  }


  run({cmd, folder = '.', label = "EXECUTING", output = true, showLog = true} : ExecuteCommand) {
    let msg = chalk.yellow(folder);
    if (output && showLog) console.log(`\n${chalk.yellow(folder)}: ${chalk.yellow(label)} ${chalk.cyan(cmd)}`);

    var options: any = {}
    options.stdio = [output?0:'ignore', output?1:'ignore', output?2:'ignore'];
    options.cwd = folder;
    options.env = process.env;
    
    const parallel = false;
    if (parallel) {
      var child: cp.ChildProcess = cp.exec(cmd, options, (error, stdout, stderr) => {
          if (error) {
            if (output) console.log(`${chalk.red(folder)}: '${cmd}' exited with code: ${error}`);
              return;
          }

          if (output) {
            if (showLog) console.log(chalk.green(`${folder} ✓`));
            console.log(stdout);      
          }
      });
    } else {
      try {
        var error= cp.execSync(cmd, options);
        if (error) {
          if (output) console.log(`${chalk.red(folder)}: '${cmd}' exited with code: ${JSON.stringify(error)}`);
            return;
        }
        if (output) {
          if (showLog) console.log(chalk.green(`${folder} ✓`));
        }
      } catch (e) {
        if (output) console.log(`${chalk.red(folder)}: '${cmd}' exited with code: ${e}`);
      }
    }

  }

}