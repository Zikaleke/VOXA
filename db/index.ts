import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from 'ws';
import * as schema from '../shared/schema';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL não configurada, usando URL local");
}

// Usar URL direta sem pooler
const dbUrl = process.env.DATABASE_URL?.replace('-pooler.', '.');
const sql = neon(dbUrl || 'postgresql://postgres:postgres@localhost:5432/voxa');
export const db = drizzle(sql, { schema });

console.log('Configuração do banco de dados inicializada');