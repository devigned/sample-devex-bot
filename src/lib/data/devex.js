import * as sql from "sequelize";

class DevExData {
  constructor(connString) {
    this.sequelize = new sql.Sequelize(connString);
    // select EmailLogin, GitHubUser, CorpLogin from [user] u inner join usergroup ug on ug.userid = u.userid where ug.groupid = 3
    this.user = this.sequelize.define('user', {
      userId: {
        type: Sequelize.DataTypes.INTEGER,
        field: 'userid'
      },
      emailLogin: {
        type: Sequelize.DataTypes.STRING,
        field: 'EmailLogin'
      },
      githubUser: {
        type: Sequelize.DataTypes.STRING,
        field: 'GitHubUser'
      },
      corpLogin: {
        type: Sequelize.DataTypes.STRING,
        field: 'CorpLogin'
      }
    }, {
      freezeTableName: true
    });

    this.usergroup = this.sequelize.define('usergroup', {
      userId: {
        type: Sequelize.DataTypes.INTEGER,
        field: 'UserId'
      },
      groupId: {
        type: Sequelize.DataTypes.INTEGER,
        field: 'GroupId'
      }
    });

    this.group = this.sequelize.define('group', {
      groupId: {
        type: Sequelize.DataTypes.INTEGER,
        field: 'GroupId'
      },
      name: {
        type: Sequelize.DataTypes.STRING,
        field: 'Name'
      }
    });

    this.user.belongsToMany(this.group, {
      through: {
        model: this.usergroup,
        unique: true,
      },
      foreignKey: 'groupId'
    });

    this.group.belongsToMany(this.user, {
      through: {
        model: this.usergroup,
        unique: true,
      },
      foreignKey: 'userId'
    })
  }
}

export { DevExData }
