// Commands:
//   hubot list swagger reviewers - lists the emails for all Swagger reviewers

'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = "./dist/bot";

module.exports = (robot) => {
  fs.readdirSync(ROOT).forEach((dir) => {
    require(path.join('..', ROOT, dir)).default(robot);
  });
};
