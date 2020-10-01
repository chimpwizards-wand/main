
import Debug from 'debug';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml'
import * as _ from 'lodash';  
import * as utils from './Utils'


const debug = Debug("w:cli:config");

interface ConfigOptions {
  context?: any, 
  dir?: string,
  forceNew?: boolean
}

export class Config  {
  constructor() {
  }

  load() {
    debug(`Loading config...`);

    debug(`Find nearest to current location config file`)
    const configPath = utils.findNearestConfig(process.cwd()) || process.cwd();
    const isConfigPresent = (fs.existsSync(configPath));
    var config : any = {};

    debug(`If there is a config file inject location as a temporary metadata`)
    if (isConfigPresent) {
      config= yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      config['local'] = {
        location: configPath,
        root: path.dirname(path.dirname(configPath))
      }
      debug(`CONFIG: ${JSON.stringify(config)}`);
      debug(`Location: ${config.local.location}`);
      debug(`Root: ${config.local.root}`);
    }
    return config;
  }

  save({ context = {}, dir= process.cwd(), forceNew = false }:ConfigOptions) {
    debug(`Saving config...`);

    debug(`Calculate config location folder`)
    let configPath: string = path.join(
      dir,
      './.wand', 
      './config.yaml'
    );

    debug(`If new is forced then create configu in current folder if doesn't exists`)
    if (!forceNew) {
      configPath = utils.findNearestConfig(dir);
    }

    debug(`CONFIG Found @ ${configPath}`)
    const isConfigPresent = (fs.existsSync(configPath));

    var config : any = {};

    if (isConfigPresent) {
      config= yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      debug(`CONFIG: ${config}`);
    }

    debug(`Merge existing config with new data`)
    _.merge(config, context);
    delete config['local'] //Dont save temporarly metadata

    debug(`Save configuration`)
    var yml = yaml.dump(config);
    var rootFolder = path.dirname(configPath);
    fs.mkdirSync(rootFolder,{ recursive: true });
    fs.writeFileSync(configPath, yml)

    return configPath;

  }

  inContext({ dir= '.' }:ConfigOptions): boolean {
    let configPath = utils.findNearestConfig(dir);
    const isConfigPresent = (fs.existsSync(configPath));
    return isConfigPresent;
  }
  
}