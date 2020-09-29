
import Debug from 'debug';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml'
import * as _ from 'lodash';  
import * as cp from 'child_process';

const me = require("../package.json");

const debug = Debug("w:cli:registrator");

export class Registrator  {
  constructor() {
  }


  getDefaultGlobalRoot() {
    return (cp.execSync("npm root -g") + "").trim();
  }

  findLocation(): string {
    var location = '';

    const globalRoots = this.getDefaultGlobalRoot();
    globalRoots.split(":").forEach(cwd => {
      debug(`Looking @ ${cwd}`)
      let configPath = path.join(
        cwd,
        me.name, 
      );

      debug(`Checking:  ${configPath}`)

      var isLocationPresebnt = (fs.existsSync(configPath));
      if (isLocationPresebnt) location = configPath;

    });


    return location;

  }



  load() {
    debug(`Loading config...`);

    const configPath = path.join(
        this.findLocation(),
        './.config', 
        './commands.yaml'
      );


    const isConfigPresent = (fs.existsSync(configPath));
    var config : any = {
      commands: {
        init: '@chimpwizards-wand/init'
      }
    };

    if (isConfigPresent) {
      config= yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      debug(`CONFIG: ${config}`);
    }
    return config;
  }

  
}