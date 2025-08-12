const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
	class User extends Model {}

	User.init(
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
		},
		{
			sequelize,
			modelName: 'User',
			tableName: 'users',
			timestamps: true,
		}
	);

	return User;
};
