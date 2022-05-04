/* Declaration-promotion-S */ import * as __CJS_import__5__ from '@angular/core'; import * as __CJS_import__6__ from '@angular/core'; import * as __CJS_import__7__ from './input'; import * as __CJS_import__8__ from './b'; import * as __CJS_import__9__ from './c'; import * as __CJS_import__10__ from './Home.vue'; /* Declaration-promotion-E */import 'path';
import 'path';

try {
  require('uninstalled-external-module');
} catch (ignored) {
  /* ignore */
}

import * as fs from 'fs';
import { readFile } from 'fs';
import { stat, cp as cpAlias } from 'fs';

const modules = [
  __CJS_import__5__,
  __CJS_import__6__.default.value,
];

const json = {
  a: __CJS_import__7__,
  b: __CJS_import__8__.b(),
  c: [
  	__CJS_import__9__,
  ],
};

const routes = [
  {
    name: 'Home',
   	component: __CJS_import__10__,
  },
];

function load(path) {
  require(path);
}

const load2 = path => require(path);
