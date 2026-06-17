const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

app.use(express.static(ROOT, { extensions: ['html'] }));

app.get('/', (_req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
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
  console.log(`\n  עמותת אגוז — האתר רץ ב-localhost\n  http://localhost:${PORT}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  פורט ${PORT} כבר בשימוש — השרver כנראה כבר רץ.\n  פתח בדפדפן: http://localhost:${PORT}\n`);
    console.error(`  להפעלה מחדש: Ctrl+C בחלון הישן, או הרץ:\n  taskkill /PID <מספר> /F\n`);
    process.exit(1);
  }
  throw err;
});
