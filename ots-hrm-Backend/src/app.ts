import "reflect-metadata";
import { dbManager } from "./utility/database-manager";
import { getAppConfig } from "./config/db-env.config";
import "./dal/db/db-source";
import { initializeSocket } from "./socket/socket-io";
import { fastify } from "fastify";
import { fastifyRegisters } from "./utility";
import { ExtendedRequest } from "./models/inerfaces/extended-Request";
import { log, error } from "console";
import fastifymultipart from "@fastify/multipart";
import { errorHandler } from "./middlewares";
import cookie from '@fastify/cookie';
import { container } from 'tsyringe';
import { initScheduleJobs } from "./schedule-jobs";

// Get application configuration
const appConfig = getAppConfig();
const PORT = appConfig.port;

log("Starting..."); 

const app = fastify({ logger: true });
app.register(cookie, {
  hook: 'onRequest', // parse cookies in all requests
})
app.register(fastifymultipart);
app.setErrorHandler(errorHandler);
const io = initializeSocket(app.server);
fastifyRegisters(app);


app.post("/throw", async (req, res) => {
  let request = req as ExtendedRequest;
  let data = await req.file()
  let file = data ? data.file : undefined;
  log(request.user);
  throw new Error("test error");
});

app.get("/", (req, res) => {
  res.send({ message: "Hello, Fastify!" });
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const dbHealthy = await dbManager.isConnected();
    const connectionInfo = await dbManager.getConnectionInfo();
    
    res.send({ 
      status: "OK", 
      database: dbHealthy ? "Connected" : "Disconnected",
      connectionInfo,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).send({ 
      status: "Error", 
      database: "Error",
      error: err instanceof Error ? err.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
  }
});

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    error(err);
    process.exit(1);
  }

  log(`🚀 Fastify server running at ${address}`);
  log(`📊 Health check available at ${address}/health`);

  // Start scheduled jobs after server and DI container are fully initialized
  initScheduleJobs(container, io);
});

process.on('unhandledRejection', (reason, promise) => {
  error('Unhandled Rejection at:', promise, 'reason:', reason);
});