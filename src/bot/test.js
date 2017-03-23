export default function(robot) {
  robot.hear(/test/, (res) => {
    res.reply('echo test from babel 1');
  });
}