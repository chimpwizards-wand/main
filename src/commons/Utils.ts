
import Debug from 'debug';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';  

const debug = Debug("w:cli:utils");
const cp = require("child_process");
const chalk = require('chalk');
const info = require("../package.json");

export function  isDirectory(path: string) {
    try {
        var stat = fs.lstatSync(path);
        return stat.isDirectory();
    } catch (e) {
        // lstatSync throws an error if path doesn't exist
        return false;
    }
}

export function  getDefaultGlobalRoot() {
    return (cp.execSync("npm root -g") + "").trim();
}

export function  findInstalledSpells(cwd: string, scope?: string) {
    var folders: string[] = [];
    var scopeToFind = scope || '@chimpwizard';
    if (isDirectory(cwd)) {
        debug(`CHECKING inside ${cwd}}`);
        fs.readdirSync(cwd).forEach(name => {
        const filePath = path.join(cwd, name);
    
        if (name[0] === "@") {
            const scopeName = name;
            const scopePath = filePath;
            fs.readdirSync(scopePath).forEach(name => {
                var matcher = new RegExp('^'+scopeToFind, "gi");
                if (matcher.test(scopeName)) {
                    debug(`FOUND Scope to load ${scopeName}}`);
                    folders.push(path.join(scopePath, name))
                }
            });
        }
        });
    }
    return folders;
}

export function findNearestConfig( cwd?: string ): string {
    var parentFolder = cwd || process.cwd()
    debug(`CHECKING [${parentFolder}]`)

    var configPath: string|undefined = path.join(
        parentFolder,
        './.wand', 
        './config.yaml'
      );

    let grandParent = path.dirname(parentFolder);
    debug(`Parent folder: ${parentFolder}`)
    debug(`Grand Parent folder: ${grandParent}`)
    if (!fs.existsSync(configPath) && parentFolder != grandParent && parentFolder != '.' ) {
        configPath = findNearestConfig(grandParent)
    }

    //Set current as location
    if (!fs.existsSync(configPath)) {
        configPath = path.join(
            process.cwd(),
            './.wand', 
            './config.yaml'
          );
    }

    debug(`CONFIG PATH: ${configPath}`)
    return configPath;
}