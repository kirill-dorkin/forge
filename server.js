const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Ensure data directory and JSON files exist so that the server
// does not fail when writing to them on first run.
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
['services', 'portfolio', 'about', 'team'].forEach(name => {
  const p = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, '[]');
  }
});

function readData(name) {
  const p = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeData(name, data) {
  const p = path.join(DATA_DIR, `${name}.json`);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function registerCrudRoutes(name) {
  const base = `/api/${name}`;
  app.get(base, (req, res) => {
    res.json(readData(name));
  });
  app.post(base, (req, res) => {
    const items = readData(name);
    const item = req.body;
    if (item.imageData) {
      const match = item.imageData.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        const ext = match[1].split('/')[1] || 'png';
        const fileName = Date.now() + '.' + ext;
        fs.writeFileSync(path.join(UPLOAD_DIR, fileName), Buffer.from(match[2], 'base64'));
        item.image = path.join('uploads', fileName);
      }
      delete item.imageData;
    }
    item.id = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
    items.push(item);
    writeData(name, items);
    res.json(item);
  });
  app.put(`${base}/:id`, (req, res) => {
    const id = Number(req.params.id);
    const items = readData(name);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return res.sendStatus(404);
    const updated = { ...req.body };
    if (updated.imageData) {
      const match = updated.imageData.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        const ext = match[1].split('/')[1] || 'png';
        const fileName = Date.now() + '.' + ext;
        fs.writeFileSync(path.join(UPLOAD_DIR, fileName), Buffer.from(match[2], 'base64'));
        updated.image = path.join('uploads', fileName);
      }
      delete updated.imageData;
    }
    items[idx] = { ...items[idx], ...updated, id };
    writeData(name, items);
    res.json(items[idx]);
  });
  app.delete(`${base}/:id`, (req, res) => {
    const id = Number(req.params.id);
    let items = readData(name);
    const len = items.length;
    items = items.filter(i => i.id !== id);
    if (items.length === len) return res.sendStatus(404);
    writeData(name, items);
    res.sendStatus(204);
  });
}

['services', 'portfolio', 'about', 'team'].forEach(registerCrudRoutes);

app.use('/assets', express.static(path.join(__dirname, 'dist/assets')));
app.use('/css', express.static(path.join(__dirname, 'dist/css')));
app.use('/js', express.static(path.join(__dirname, 'dist/js')));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'server/views'));

app.get('/', (req, res) => {
  res.render('index', {
    services: readData('services'),
    portfolio: readData('portfolio'),
    about: readData('about'),
    team: readData('team')
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
