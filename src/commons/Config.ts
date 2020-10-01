
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

  //load({ context = {}, dir= '.' }:ConfigOptions ) {
  load() {
    debug(`Loading config...`);

    const configPath = utils.findNearestConfig(process.cwd()) || process.cwd();
    const isConfigPresent = (fs.existsSync(configPath));
    var config : any = {};

    if (isConfigPresent) {
      config= yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      config['local'] = {
        location: configPath,
        root: path.dirname(path.dirname(configPath))
      }
      debug(`CONFIG: ${JSON.stringify(config)}`);
    }
    return config;
  }

  save({ context = {}, dir= process.cwd(), forceNew = false }:ConfigOptions) {
    debug(`Saving config...`);

    let configPath: string = path.join(
      dir,
      './.wand', 
      './config.yaml'
    );
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

    _.merge(config, context);
    delete config['local'] //Dont save location

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