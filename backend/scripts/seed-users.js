import bcrypt from 'bcryptjs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../data/users.json');

const password = 'password123';
const hash = await bcrypt.hash(password, 10);
const now = new Date().toISOString();

const users = [
  { id: 'user-001', name: 'Admin Principal', email: 'admin@joanlunaviajes.com', password: hash, role: 'admin', createdAt: now },
  { id: 'user-002', name: 'Agente Comercial', email: 'agente@joanlunaviajes.com', password: hash, role: 'agent', createdAt: now },
  { id: 'user-003', name: 'Diseñador Web', email: 'diseno@joanlunaviajes.com', password: hash, role: 'designer', createdAt: now },
  { id: 'user-004', name: 'Cliente Demo', email: 'cliente@demo.com', password: hash, role: 'client', createdAt: now },
];

await writeFile(OUT, `${JSON.stringify(users, null, 2)}\n`, 'utf8');
console.log('✓ users.json generado — contraseña para todos: password123');
