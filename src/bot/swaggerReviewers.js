import {DevExData} from "../lib/data/devex";
import * as _ from "lodash";

const reviewerGroupId = 3;

export default function (robot) {
  let db = new DevExData(process.env.DEVEX_CONN_STRING);
  robot.brain.data.swaggerReviewerReminderId = null;

  let swaggerReviewersQuery = () => {
    return db.user.findAll({
      include: [{
        model: db.group,
        where: {groupId: reviewerGroupId}
      }]
    })
  };

  let teamMembers = robot.adapter.client.web.users.list();
  let findUserByEmail = email => {
    teamMembers.then(res => {
      return _.find(res.members, membrer => membrer.profile.email === email);
    });
  };

  robot.hear(/list swagger reviewers/i, (res) => {
    swaggerReviewersQuery().then(
      (result) => {
        if (result.length === 0) {
          res.reply("I didn't find any Swagger reviewers... Something must be wrong.");
        } else {
          let emails = _.map(result, (res) => res.emailLogin).join(', ');
          let msg = `Here are the emails for Swagger reviewers: ${emails}`;
          res.reply(msg);
        }
      },
      (fail) => {
        res.reply(fail);
      });
  });

  robot.enter(res => {

  });

  let timeout = 30 * 1000; // ms

  robot.listen(
    message => {
      // is this message coming in on the channel we care about?
      return robot.adapter.client.web.channels.info(message.room).then(
        room => {
          if (room.channel.name === 'test-sally') {
            return message;
          }
        },
        fail => {
          robot.logger.error(fail);
        });
    },
    response => {
      // handle the message by queuing or forgetting about the reminder
      swaggerReviewersQuery().then(reviewers => {
        response.match.then(msg => {
          if(!msg) return;
          if (_.includes(_.map(reviewers, rev => rev.emailLogin), msg.user.profile.email)) {
            // this is a reviewer, so clear reminders and remember most recent reviewer
            robot.brain.data.swaggerLastReviewerMessageTime = (new Date).getTime();
            if (robot.brain.data.swaggerReviewerReminderId) {
              clearTimeout(robot.brain.data.swaggerReviewerReminderId);
            }
          } else {
            // if we haven't queued a reminder already, queue one up
            if(!robot.brain.data.swaggerReviewerReminderId){
              // this is not a reviewer, so set trigger to remind a reviewer in a few mins
              let adjustedTimeout = timeout;
              let lastReviewerMessageTime = robot.brain.data.swaggerLastReviewerMessageTime;
              if(lastReviewerMessageTime && (new Date).getTime() - lastReviewerMessageTime > 5 * 60 * 1000) { // less than 5 mins ago
                adjustedTimeout = timeout * 5; // give more time if the reviewer has been recently active
              }
              robot.brain.data.swaggerReviewerReminderId = setTimeout(() => {
                findUserByEmail(response.random(reviewers).emailLogin).then(slackUser => {
                  response.reply(`@${slackUser.name} is on duty and should be able to assist you shortly.`);
                });
              }, adjustedTimeout);
            }
          }
        });
      });
    });
}
