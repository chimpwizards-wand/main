
import Debug from 'debug';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml'
import * as _ from 'lodash';  
import * as utils from './Utils'

const debug = Debug("w:cli:config");

interface ConfigOptions {
  context?: any, 
  dir?: string
}

export class Config  {
  constructor() {
  }

  //load({ context = {}, dir= '.' }:ConfigOptions ) {
  load() {
    debug(`Loading config...`);

    const configPath = utils.findNearestConfig(process.cwd()) || process.cwd();

    //For backwards compatibility
    const metaPath = '.meta';
    const lernaPath='lerna.json'

    const isConfigPresent = (fs.existsSync(configPath));


    var config : any = {};

    if (isConfigPresent) {
      config= yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      config['location'] = configPath;
      debug(`CONFIG: ${config}`);
    }
    return config;
  }

  save({ context = {}, dir= '.' }:ConfigOptions) {
    debug(`Saving config...`);

    const configPath: string = utils.findNearestConfig(dir);
    debug(`CONFIG Found @ ${configPath}`)
    const isConfigPresent = (fs.existsSync(configPath));

    var config : any = {};

    if (isConfigPresent) {
      config= yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      delete config['location'] //Dont save location as key
      debug(`CONFIG: ${config}`);
    }

    _.merge(config, context);

    var yml = yaml.dump(config);
    var rootFolder = path.dirname(configPath);

    fs.mkdirSync(rootFolder,{ recursive: true });
    fs.writeFileSync(configPath, yml)

    return configPath;

  }
  
}