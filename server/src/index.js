const express = require('express');
const sequelize = require('./db.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sincronizar modelos con la base de datos
sequelize
	.sync({ alter: true })
	.then(() => {
		console.log('Base de datos sincronizada');
	})
	.catch((err) => {
		console.error('Error sincronizando la base de datos:', err);
	});

app.get('/', async (req, res) => {
	try {
		const result = await sequelize.query('SELECT NOW()');
		res.send(`Conectado a la base de datos. Fecha/hora: ${result[0][0].now}`);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error conectando a la base de datos');
	}
});

app.listen(PORT, () => {
	console.log(`Servidor escuchando en puerto ${PORT}`);
});
