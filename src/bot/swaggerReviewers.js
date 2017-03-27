import { DevExData } from "../lib/data/devex";
import * as _ from "lodash";

const reviewerGroupId = 3;

export default function (robot) {
  robot.hear(/list swagger reviewers/i, (res) => {
    let db = new DevExData(process.env.DEVEX_CONN_STRING);
    db.user.findAll({
      include: [{
        model: db.group,
        where: { groupId: reviewerGroupId }
      }]
    }).then((result) => {
      if(result.length === 0){
        res.reply("I didn't find any Swagger reviewers... Something must be wrong.");
      } else {
        let emails = _.map(result, (res) => res.emailLogin).join(', ');
        let msg = `Here are the emails for Swagger reviewers: ${emails}`;
        res.reply(msg);
      }
    }, (fail) => {
      res.reply(fail);
    });
  });
}
