require('path');
require('path').resolve;

try {
  // TODO
  require('uninstalled-external-module');
} catch (ignored) {
  /* ignore */
}

const fs = require('fs');
const readFile = require('fs').readFile;
const { stat, cp: cpAlias } = require('fs');

const modules = [
  require('@angular/core'),
  require('@angular/core').default.value,
];

const json = {
  a: require('./input'),
  b: require('./b').b(),
  c: [
  	require('./c'),
  ],
};

const routes = [
  {
    name: 'Home',
   	component: require('./Home.vue'),
  },
];

function load(path) {
  // TODO
  require(path);
}

// TODO
const load2 = path => require(path);

// ---- v0.3.2 ----

if (require('./if-id').func()) {
  require('./if-id').foo.bar
}
