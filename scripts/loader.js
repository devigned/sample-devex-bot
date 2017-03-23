'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = "./dist/bot";

const stripExtension = path => path.split('.').slice(0, -1).join('.');

module.exports = (robot) => {
  fs.readdirSync(ROOT).forEach((dir) => {
    require(path.join('..', ROOT, dir)).default(robot);
  });
};