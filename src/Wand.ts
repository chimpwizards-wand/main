#!/usr/bin/env node

import Debug from 'debug';
import {Root} from './Root';
import {Config} from './commons/Config'
const debug = Debug("w:cli");

Root.init({})