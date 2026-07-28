require('dotenv').config();

const express = require('express');
const path = require('path');
const { sendContactEmail } = require('./lib/contact-email');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

app.use(express.json({ limit: '20kb' }));

app.post('/api/contact', async (req, res) => {
  try {
    const result = await sendContactEmail(req.body);
    res.status(200).json({ ok: true, id: result.id || null });
  } catch (error) {
    if (error.code === 'missing_fields' || error.code === 'invalid_email') {
      return res.status(400).json({ error: error.code });
    }

    console.error('Contact email failed:', error.code || error.message);
    res.status(500).json({ error: 'send_failed' });
  }
});

app.use(express.static(ROOT, { extensions: ['html'] }));

app.get('/', (_req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

const legacyRedirects = {
  '/events/family-ceremony/': '/event?slug=family-ceremony',
  '/events/family-ceremony': '/event?slug=family-ceremony',
  '/jobs.html': '/contact',
  '/jobs': '/contact',
  '/blog.html': '/',
  '/blog': '/',
  '/pros.html': '/contact',
  '/pros': '/contact',
  '/ambassadors.html': '/donate',
  '/ambassadors': '/donate',
};

Object.entries(legacyRedirects).forEach(([from, to]) => {
  app.get(from, (_req, res) => {
    if (to.startsWith('http')) {
      res.redirect(302, to);
    } else {
      res.redirect(301, to);
    }
  });
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(ROOT, 'admin', 'index.html'));
});

app.get('/admin/', (_req, res) => {
  res.sendFile(path.join(ROOT, 'admin', 'index.html'));
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(ROOT, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`\n  עמותת אגוז - האתר רץ ב-localhost\n  http://localhost:${PORT}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  פורט ${PORT} כבר בשימוש - השרver כנראה כבר רץ.\n  פתח בדפדפן: http://localhost:${PORT}\n`);
    console.error(`  להפעלה מחדש: Ctrl+C בחלון הישן, או הרץ:\n  taskkill /PID <מספר> /F\n`);
    process.exit(1);
  }
  throw err;
});
