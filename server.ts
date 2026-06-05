import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Essential Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Basic IP visitor logging hook
  app.use((req, _res, next) => {
    // Avoid logging static assets and hot-module reload paths
    if (
      !req.path.startsWith('/api') &&
      !req.path.includes('.') &&
      !req.path.startsWith('/@v') &&
      !req.path.startsWith('/node_modules')
    ) {
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';
      db.logVisitor(ip, userAgent, req.path);
    }
    next();
  });

  // REST APIs
  app.get('/api/state', (_req, res) => {
    try {
      res.json({
        settings: db.getSettings(),
        categories: db.getCategories(),
        articles: db.getArticles(),
        faqs: db.getFAQs(),
        exchange_rates: db.getExchangeRates(),
        conversions: db.getConversions(),
        visitors: db.getVisitors()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch global state' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const users = db.getUsers();
    const found = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password_hash === password
    );

    if (found) {
      res.json({
        success: true,
        user: {
          id: found.id,
          username: found.username,
          role: found.role,
          name: found.name
        }
      });
      return;
    }

    res.status(401).json({ error: 'Invalid username or password credentials.' });
    return;
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { username, registeredName, newPassword } = req.body;
    if (!username || !registeredName || !newPassword) {
      return res.status(400).json({ error: 'All fields are strictly required for security verification' });
    }

    const success = db.setPassword(username, registeredName, newPassword);
    if (success) {
      return res.json({ success: true, message: 'Identity verified successfully! Password updated.' });
    } else {
      return res.status(404).json({ error: 'Verification failed. Username or registered name do not match our database.' });
    }
  });

  // Process a live unit or currency calculation
  app.post('/api/convert', (req, res) => {
    const { type, fromUnit, toUnit, value } = req.body;
    if (!type || !fromUnit || !toUnit || value === undefined) {
      res.status(400).json({ error: 'Missing parameters for conversion' });
      return;
    }

    const val = parseFloat(value);
    if (isNaN(val)) {
      res.status(400).json({ error: 'Input value must be a valid number' });
      return;
    }

    let result = 0;

    // Perform conversions based on category
    if (type === 'currency_converter') {
      const exchange = db.getExchangeRates();
      const baseValue = val / (exchange.rates[fromUnit] || 1);
      result = baseValue * (exchange.rates[toUnit] || 1);
    } else if (type === 'length-converter') {
      // Base unit: meters
      const multipliers: Record<string, number> = {
        meters: 1,
        kilometers: 1000,
        centimeters: 0.01,
        millimeters: 0.001,
        miles: 1609.34,
        yards: 0.9144,
        feet: 0.3048,
        inches: 0.0254
      };
      const meters = val * (multipliers[fromUnit] || 1);
      result = meters / (multipliers[toUnit] || 1);
    } else if (type === 'weight-converter') {
      // Base unit: kilograms
      const multipliers: Record<string, number> = {
        kilograms: 1,
        grams: 0.001,
        milligrams: 0.000001,
        pounds: 0.45359237,
        ounces: 0.02834952,
        stone: 6.35029318,
        tons: 1000
      };
      const kgs = val * (multipliers[fromUnit] || 1);
      result = kgs / (multipliers[toUnit] || 1);
    } else if (type === 'temperature-converter') {
      if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
        result = (val * 9/5) + 32;
      } else if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
        result = (val - 32) * 5/9;
      } else if (fromUnit === 'celsius' && toUnit === 'kelvin') {
        result = val + 273.15;
      } else if (fromUnit === 'kelvin' && toUnit === 'celsius') {
        result = val - 273.15;
      } else if (fromUnit === 'fahrenheit' && toUnit === 'kelvin') {
        result = ((val - 32) * 5/9) + 273.15;
      } else if (fromUnit === 'kelvin' && toUnit === 'fahrenheit') {
        result = ((val - 273.15) * 9/5) + 32;
      } else {
        result = val;
      }
    } else if (type === 'area-converter') {
      // Base unit: square meters
      const multipliers: Record<string, number> = {
        square_meters: 1,
        square_kilometers: 1000000,
        square_miles: 2589988.11,
        square_yards: 0.83612736,
        square_feet: 0.09290304,
        acres: 4046.85642,
        hectares: 10000
      };
      const sq_m = val * (multipliers[fromUnit] || 1);
      result = sq_m / (multipliers[toUnit] || 1);
    } else if (type === 'volume-converter') {
      // Base unit: liters
      const multipliers: Record<string, number> = {
        liters: 1,
        milliliters: 0.001,
        gallons: 3.78541,
        quarts: 0.946353,
        cups: 0.24,
        cubic_meters: 1000
      };
      const liters = val * (multipliers[fromUnit] || 1);
      result = liters / (multipliers[toUnit] || 1);
    } else {
      // Fallback
      result = val;
    }

    db.logConversion(type, fromUnit, toUnit, val, result);
    res.json({ result });
    return;
  });

  // Admin and CRUD Controls
  app.post('/api/admin/settings', (req, res) => {
    try {
      const updated = db.updateSettings(req.body);
      res.json({ success: true, settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update settings' });
    }
  });

  app.post('/api/admin/rates', (req, res) => {
    try {
      const rates = db.updateExchangeRates(req.body);
      res.json({ success: true, exchange_rates: rates });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update rates' });
    }
  });

  app.post('/api/admin/articles', (req, res) => {
    try {
      const art = db.addArticle(req.body);
      res.json({ success: true, article: art });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create article' });
    }
  });

  app.put('/api/admin/articles/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = { ...req.body, id };
      const ok = db.updateArticle(updated);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update article' });
    }
  });

  app.delete('/api/admin/articles/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ok = db.deleteArticle(id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete article' });
    }
  });

  app.post('/api/admin/faqs', (req, res) => {
    try {
      const created = db.addFAQ(req.body);
      res.json({ success: true, faq: created });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create faq' });
    }
  });

  app.delete('/api/admin/faqs/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ok = db.deleteFAQ(id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete faq' });
    }
  });

  app.post('/api/increment-views', (req, res) => {
    try {
      const { slug } = req.body;
      db.incrementArticleViews(slug);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to increment view count' });
    }
  });

  // Serve static assets / Vite files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express converter server running on port ${PORT}`);
  });
}

startServer();
