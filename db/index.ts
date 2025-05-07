
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from 'ws';
import * as schema from '../shared/schema';

neonConfig.webSocketConstructor = ws;

// Configuração do banco de dados
const DATABASE_URL = "postgresql://postgres:Willian2012.@db.idzcwcmvqxvlqhbzuouk.supabase.co:5432/postgres";

try {
  // Usar a URL direta do banco de dados
  const sql = neon(DATABASE_URL);
  export const db = drizzle(sql, { schema });
  
  console.log('Configuração do banco de dados inicializada com sucesso');
} catch (error) {
  console.error('Erro ao inicializar conexão com banco de dados:', error);
  // Exportar um objeto de banco de dados mock para evitar erros de importação
  export const db = {} as any;
}
