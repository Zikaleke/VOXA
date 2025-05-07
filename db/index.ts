
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada. Configure a variável de ambiente DATABASE_URL.");
}

try {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });
  
  // Testar conexão
  pool.connect()
    .then(() => {
      console.log('Conectado ao banco de dados com sucesso');
    })
    .catch(err => {
      console.error('Erro ao conectar ao banco de dados:', err);
      process.exit(1);
    });

  export { pool, db };
} catch (error) {
  console.error('Erro ao configurar banco de dados:', error);
  process.exit(1);
}
