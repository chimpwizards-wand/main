
import Debug from 'debug';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml'
import * as _ from 'lodash';  

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

    const configPath = path.join(
        ('.'),
        ('./.wand'), 
        ('./config.yaml')
      );

    //For backwards compatibility
    const metaPath = '.meta';
    const lernaPath='lerna.json'

    const isConfigPresent = (fs.existsSync(configPath));


    var config : any = {};

    if (isConfigPresent) {
      config= yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      debug(`CONFIG: ${config}`);
    }
    return config;
  }

  save({ context = {}, dir= '.' }:ConfigOptions) {
    debug(`Saving config...`);

    const configPath = path.join(
      (dir),
      ('.wand'), 
      ('config.yaml')
    );
    const isConfigPresent = (fs.existsSync(configPath));

    var config : any = {};

    if (isConfigPresent) {
      config= yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
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