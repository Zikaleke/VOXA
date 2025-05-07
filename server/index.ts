import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const startServer = async () => {
  try {
    // Verificar configuração do banco de dados
    if (!process.env.DATABASE_URL) {
      console.warn("\n⚠️  AVISO: DATABASE_URL não está configurada!");
      console.warn("⚠️  Para configurar, vá em Tools -> Secrets e adicione DATABASE_URL com sua URL do banco de dados.");
      console.warn("⚠️  A aplicação pode não funcionar corretamente sem essa configuração.\n");
    }
    
    const server = await registerRoutes(app);
    
    app.use(cors({
      origin: ['http://localhost:5000', 'https://localhost:5000', '*'],
      credentials: true
    }));

    const port = process.env.PORT || 5000;
    
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    server.listen(port, "0.0.0.0", () => {
      console.log(`\n🚀 Servidor rodando na porta ${port} em modo ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 URL local: http://localhost:${port}`);
      console.log(`🌐 URL Replit: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co\n`);
    });
  } catch (error) {
    console.error("\n❌ Erro ao iniciar servidor:", error);
    
    if (error instanceof Error && error.message.includes('getaddrinfo ENOTFOUND')) {
      console.error("❌ Erro de conexão com banco de dados: Não foi possível resolver o nome do host.");
      console.error("❌ Verifique se a URL do banco de dados está correta em Tools -> Secrets.\n");
    }
    
    process.exit(1);
  }
};

startServer();