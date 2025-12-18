// Web dashboard server (native Node.js http, no dependencies)

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { getDashboardHtml } from './html.js';
import { handleApiRequest } from './api.js';

export interface ServerOptions {
  port: number;
  onListening?: (port: number) => void;
  onError?: (error: Error) => void;
}

function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  const url = req.url || '/';

  // CORS headers for API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API routes
  if (url.startsWith('/api/')) {
    const handled = handleApiRequest(req, res);
    if (handled) return;

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Dashboard HTML (root path)
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getDashboardHtml());
    return;
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

export function startServer(options: ServerOptions): void {
  const { port, onListening, onError } = options;

  const server = createServer(handleRequest);

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      const error = new Error(`Port ${port} is already in use`);
      if (onError) onError(error);
      else console.error(error.message);
      process.exit(1);
    } else {
      if (onError) onError(err);
      else throw err;
    }
  });

  server.listen(port, () => {
    if (onListening) onListening(port);
  });

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down dashboard server...');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
