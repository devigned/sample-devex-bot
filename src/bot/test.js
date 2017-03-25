import { DevExData } from "../lib/data/devex"

export default function (robot) {
  robot.hear(/test/, (res) => {
    let db = new DevExData(process.env.DEVEX_CONN_STRING);
    db.user.findAll({
      include: [{
        model: db.group,
        where: { groupId: 3 }
      }]
    }).then((result) => {
      res.reply(result);
    }, (fail) => {
      res.reply(fail);
    });
  });
}
