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
      console.log(`Servidor rodando na porta ${port} em modo ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
};

startServer();