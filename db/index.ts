import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from 'ws';
import * as schema from '@/shared/schema';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL não configurada, usando URL local");
}

const sql = neon(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/voxa');
export const db = drizzle(sql, { schema });

console.log('Configuração do banco de dados inicializada');