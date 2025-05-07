import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from 'ws';
import * as schema from '../shared/schema';

neonConfig.webSocketConstructor = ws;

// Configuração do banco de dados
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL não configurada. Por favor, configure esta variável de ambiente em Secrets.");
  console.warn("Utilizando URL local para desenvolvimento. A aplicação pode não funcionar corretamente.");
}

try {
  // Usar URL direta sem pooler
  const dbUrl = process.env.DATABASE_URL?.replace('-pooler.', '.');
  const sql = neon(dbUrl || 'postgresql://postgres:postgres@localhost:5432/voxa');
  export const db = drizzle(sql, { schema });
  
  console.log('Configuração do banco de dados inicializada com sucesso');
} catch (error) {
  console.error('Erro ao inicializar conexão com banco de dados:', error);
  // Exportar um objeto de banco de dados mock para evitar erros de importação
  export const db = {} as any;
}