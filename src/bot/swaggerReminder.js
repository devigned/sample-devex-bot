import * as _ from "lodash";
import * as moment from "moment";
import * as chrono from "chrono-node";

let timeoutIds = {};

class SwaggerSlackReminders {
  constructor(robot) {
    this.robot = robot;
    this.cache = [];

    robot.brain.on('on', () => {
      if (robot.brain.data.swaggerSlackReminders) {
        this.cache = _.map(this.robot.brain.data.swaggerSlackReminders, (item) => new SwaggerSlackReminder(item));
        console.log(`loaded ${this.cache.length} reminders`);
        this.queue();
      }
    });
  }

  add(reminder) {
    this.cache.push(reminder);
    this.cache.sort((a, b) => a.due - b.due);
    this.queue();
  }

  removeFirst() {
    return this.cache.shift();
  }

  queue() {
    if (this.cache.length === 0) return;

    let now = (new Date).getTime();

    let trigger = () => {
      let reminder = this.removeFirst();
      this.robot.reply(reminder.msg_envelope, `you asked me to remind you to ${reminder.action}`);
      this.queue();
    };

    let extendTimeout = (timeout, callback) => {
      if (timeout > 0x7FFFFFFF)
        setTimeout(() => extendTimeout(timeout - 0x7FFFFFFF, callback), 0x7FFFFFFF);
      else
        setTimeout(callback, timeout);
    };

    let reminder = this.cache[0];
    let duration = reminder.due - now;
    if (duration < 0) duration = 0;
    clearTimeout(timeoutIds[reminder]);
    timeoutIds[reminder] = extendTimeout(reminder.due - now, trigger);
    console.log(`reminder set with duration of ${duration}`);
  }
}

class SwaggerSlackReminder {
  constructor(data) {
    this.msg_envelope = data.msg_envelope;
    this.due = data.due;
    this.time = data.time;
    this.action = data.action;

    if (this.time && !this.due) {
      this.time.replace(/^\s+|\s+$/g, '');
      let periods = {
        weeks: {
          value: 0,
          regex: "weeks?"
        },
        days: {
          value: 0,
          regex: "days?"
        },
        hours: {
          value: 0,
          regex: "hours?|hrs?"
        },
        minutes: {
          value: 0,
          regex: "minutes?|mins?"
        },
        seconds: {
          value: 0,
          regex: "seconds?|secs?"
        }
      };

      for (let period of Object.keys(periods)) {
        let pattern = new RegExp('^.*?([\\d\\.]+)\\s*(?:(?:' + periods[period].regex + ')).*$', 'i');
        let matches = pattern.exec(this.time);
        if (matches) {
          periods[period].value = parseInt(matches[1]);
        }
      }

      this.due = (new Date).getTime();
      this.due += (
          (periods.weeks.value * 604800) +
          (periods.days.value * 86400) +
          (periods.hours.value * 3600) +
          (periods.minutes.value * 60) +
          periods.seconds.value
        ) * 1000;
    }
  }

  formatDue() {
    let dueDate = new Date(this.due);
    let duration = dueDate - new Date();
    if (duration > 0 && duration < 86400000) {
      return `in ${moment.duration(duration).humanize()}`;
    } else {
      return `on ${moment(dueDate).format('dddd, MMMM Do YYYY, h:mm:ss a')}`;
    }
  }
}


export default function (robot) {
  let slackReminders = new SwaggerSlackReminders(robot);

  robot.respond(/show reminders$/i, (msg) => {
    let text = " ";
    if (slackReminders.cache.length === 0) {
      text = "You don't have any reminders yet.";
    } else {
      for (let reminder of slackReminders.cache) {
        text += `${reminder.action} ${reminder.formatDue()}\n`;
      }
    }
    msg.send(text);
  });

  robot.respond(/delete reminder (.+)$/i, (msg) => {
    let query = msg.match[1];
    let prevLength = slackReminders.cache.length;
    //noinspection JSCheckFunctionSignatures
    slackReminders.length = _.reject(slackReminders.cache, {action: query});
    slackReminders.queue();
    if (slackReminders.cache.length !== prevLength) msg.send(`Deleted reminder ${query}`);
  });

  robot.respond(/remind me (in|on) (.+?) to (.*)/i, (msg) => {
    let type = msg.match[1];
    let time = msg.match[2];
    let action = msg.match[3];
    let options = {
      msg_envelope: msg.envelope,
      action: action,
      time: time
    };
    if (type === 'on') {
      let due = chrono.parseDate(time).getTime();
      if (due.toString() !== "Invalid Date") {
        options.due = due;
      }
    }
    let reminder = new SwaggerSlackReminder(options);
    slackReminders.add(reminder);
    msg.send(`I'll remind you to ${action} ${reminder.formatDue()}`);
  });
}
