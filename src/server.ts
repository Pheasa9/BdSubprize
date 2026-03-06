import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json({ limit: '256kb' }));

app.post('/api/telegram/send', async (req, res) => {
  const botToken = process.env['TELEGRAM_BOT_TOKEN'];
  const chatId = process.env['TELEGRAM_CHAT_ID'];

  if (!botToken || !chatId) {
    res.status(503).json({ ok: false, error: 'Telegram is not configured on server.' });
    return;
  }

  const body = (req.body || {}) as {
    customMessage?: string;
    name?: string;
    lat?: number;
    lng?: number;
    mapUrl?: string;
  };

  if (typeof body.lat !== 'number' || typeof body.lng !== 'number' || !body.name) {
    res.status(400).json({ ok: false, error: 'Invalid location payload.' });
    return;
  }

  const message = [
    'Message from sokyaBD',
    `Message: ${String(body.customMessage || '-').trim() || '-'}`,
    `Location: ${body.name}`,
    `Map: ${body.mapUrl || `https://maps.google.com/?q=${body.lat},${body.lng}`}`,
  ].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let hint = '';
      if (/chat not found/i.test(errText)) {
        hint = ' Hint: open Telegram and send /start to your bot, then retry.';
      } else if (/forbidden/i.test(errText)) {
        hint = ' Hint: bot may be blocked by the chat/user.';
      }
      res.status(502).json({ ok: false, error: `Telegram API error: ${errText}${hint}` });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: (error as Error).message });
  }
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
