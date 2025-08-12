import express from 'express';
import pool from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
	try {
		const result = await pool.query('SELECT NOW()');
		res.send(`Conectado a la base de datos. Fecha/hora: ${result.rows[0].now}`);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error conectando a la base de datos');
	}
});

app.listen(PORT, () => {
	console.log(`Servidor escuchando en puerto ${PORT}`);
});
