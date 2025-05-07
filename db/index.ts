
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/voxa';

try {
  export const pool = new Pool({ connectionString: DATABASE_URL });
  export const db = drizzle({ client: pool, schema });
  
  // Teste a conexão
  pool.connect().then(() => {
    console.log('Conectado ao banco de dados com sucesso');
  }).catch(err => {
    console.error('Erro ao conectar ao banco de dados:', err);
  });
} catch (error) {
  console.error('Erro ao configurar banco de dados:', error);
  throw error;
}
