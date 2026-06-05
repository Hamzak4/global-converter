import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { DatabaseState, Article, FAQ, ConversionLog, VisitorLog, SiteSettings } from '../types';
import { INITIAL_RATES, DEFAULT_CATEGORIES, DEFAULT_ARTICLES, DEFAULT_FAQS } from '../data';

const FILE_PATH = path.join(process.cwd(), 'db.json');

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'GlobalConverter',
  site_title: 'Pro Unit & Currency Converter Platform',
  meta_description: 'An advanced full-stack conversion hub featuring real-time currency converters and SEO guide formulas with custom administrative analytics.',
  logo_url: '/assets/logo.svg',
  google_analytics_id: 'G-XXXXXXXXXX',
  ads: {
    header: '<!-- Ad Header Section Block -->',
    sidebar: '<!-- Ad Sidebar Section Block -->',
    between_content: '<!-- Ad Inside Content Block -->',
    footer: '<!-- Ad Footer Block -->'
  },
  dark_mode_enabled: true,
  default_lang: 'en',
  company_name: 'ConvertHub LLC',
  company_phone: '+1 (555) 0192-3847',
  company_email: 'support@converthub-global.com',
  company_address: '100 Silicon Blvd, Suite 400, Mountain View, CA 94043'
};

const DEFAULT_STATE: DatabaseState = {
  users: [
    {
      id: 1,
      username: 'hamxak441@gmail.com',
      password_hash: 'Ammir$1298', // plaintext fallback or hash check
      role: 'admin',
      name: 'Amir Khan'
    },
    {
      id: 2,
      username: 'admin',
      password_hash: 'admin123',
      role: 'admin',
      name: 'Site admin'
    }
  ],
  categories: DEFAULT_CATEGORIES,
  articles: DEFAULT_ARTICLES,
  faqs: DEFAULT_FAQS,
  exchange_rates: {
    base: 'USD',
    rates: INITIAL_RATES,
    updated_at: new Date().toISOString()
  },
  conversions: [],
  visitors: [],
  settings: DEFAULT_SETTINGS
};

class DBService {
  private state: DatabaseState;
  private pool: mysql.Pool | null = null;
  private isMySQL = false;

  constructor() {
    this.state = DEFAULT_STATE;
    this.load();
    this.connectMySQL();
  }

  private load() {
    try {
      if (fs.existsSync(FILE_PATH)) {
        const raw = fs.readFileSync(FILE_PATH, 'utf-8');
        this.state = JSON.parse(raw);
        console.log('Successfully loaded state from local db.json backup.');
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('Could not read local backup db.json:', err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(FILE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write database state to local db.json:', err);
    }
  }

  private async connectMySQL() {
    const host = process.env.MYSQL_HOST;
    const user = process.env.MYSQL_USER;
    const password = process.env.MYSQL_PASSWORD;
    const database = process.env.MYSQL_DATABASE;
    const port = process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306;

    if (!host || !user || !database) {
      console.log('MySQL environment settings are not fully specified. Falling back to local db.json storage engine.');
      return;
    }

    try {
      console.log(`Connecting to MySQL database server at ${host}:${port}...`);
      this.pool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      });

      // Confirm pool reachability
      const conn = await this.pool.getConnection();
      console.log('MySQL Database Connected Successfully!');
      conn.release();
      this.isMySQL = true;

      await this.initMySQLTables();
    } catch (err: any) {
      console.error('Failed to establish MySQL connection. Reverting to persistent file engine. Error:', err.message || err);
    }
  }

  private async initMySQLTables() {
    if (!this.pool) return;
    try {
      console.log('Initializing MySQL schema relations...');
      
      const sql_users = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255),
          role VARCHAR(50),
          name VARCHAR(255)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const sql_categories = `
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255),
          slug VARCHAR(255) UNIQUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const sql_articles = `
        CREATE TABLE IF NOT EXISTS articles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255),
          slug VARCHAR(255) UNIQUE,
          category_id INT,
          meta_title VARCHAR(255),
          meta_description TEXT,
          image_url VARCHAR(255),
          views INT DEFAULT 0,
          is_seo_page BOOLEAN DEFAULT TRUE,
          created_at VARCHAR(100),
          content TEXT,
          formula VARCHAR(255),
          example TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const sql_faqs = `
        CREATE TABLE IF NOT EXISTS faqs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          question TEXT,
          answer TEXT,
          parent_type VARCHAR(100),
          parent_id VARCHAR(100)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const sql_exchange_rates = `
        CREATE TABLE IF NOT EXISTS exchange_rates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          base VARCHAR(10),
          rates TEXT,
          updated_at VARCHAR(100)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const sql_conversions = `
        CREATE TABLE IF NOT EXISTS conversions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          type VARCHAR(100),
          from_unit VARCHAR(100),
          to_unit VARCHAR(100),
          from_value DOUBLE,
          to_value DOUBLE,
          created_at VARCHAR(100)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const sql_visitors = `
        CREATE TABLE IF NOT EXISTS visitors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ip VARCHAR(100),
          user_agent TEXT,
          path VARCHAR(255),
          visited_at VARCHAR(100)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      const sql_settings = `
        CREATE TABLE IF NOT EXISTS settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          site_name VARCHAR(255),
          site_title VARCHAR(255),
          meta_description TEXT,
          logo_url VARCHAR(255),
          google_analytics_id VARCHAR(100),
          ads_header TEXT,
          ads_sidebar TEXT,
          ads_between_content TEXT,
          ads_footer TEXT,
          company_name VARCHAR(255),
          company_phone VARCHAR(100),
          company_email VARCHAR(255),
          company_address TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;

      await this.pool.execute(sql_users);
      await this.pool.execute(sql_categories);
      await this.pool.execute(sql_articles);
      await this.pool.execute(sql_faqs);
      await this.pool.execute(sql_exchange_rates);
      await this.pool.execute(sql_conversions);
      await this.pool.execute(sql_visitors);
      await this.pool.execute(sql_settings);

      console.log('MySQL schema structures verified safely.');

      // Seed tables if missing elements
      const [userRows]: any = await this.pool.execute('SELECT COUNT(*) as count FROM users');
      if (userRows[0].count === 0) {
        console.log('Inserting default users seed into MySQL table...');
        for (const u of this.state.users) {
          await this.pool.execute(
            'INSERT IGNORE INTO users (id, username, password_hash, role, name) VALUES (?, ?, ?, ?, ?)',
            [u.id, u.username, u.password_hash, u.role, u.name]
          );
        }
      }

      const [catRows]: any = await this.pool.execute('SELECT COUNT(*) as count FROM categories');
      if (catRows[0].count === 0) {
        console.log('Seeding categories into MySQL table...');
        for (const c of this.state.categories) {
          await this.pool.execute(
            'INSERT IGNORE INTO categories (id, name, slug) VALUES (?, ?, ?)',
            [c.id, c.name, c.slug]
          );
        }
      }

      const [artRows]: any = await this.pool.execute('SELECT COUNT(*) as count FROM articles');
      if (artRows[0].count === 0) {
        console.log('Seeding SEO articles into MySQL table...');
        for (const a of this.state.articles) {
          await this.pool.execute(
            'INSERT IGNORE INTO articles (id, title, slug, category_id, meta_title, meta_description, image_url, views, is_seo_page, created_at, content, formula, example) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [a.id, a.title, a.slug, a.category_id, a.meta_title, a.meta_description, a.image_url, a.views, a.is_seo_page ? 1 : 0, a.created_at, a.content, a.formula, a.example]
          );
        }
      }

      const [faqRows]: any = await this.pool.execute('SELECT COUNT(*) as count FROM faqs');
      if (faqRows[0].count === 0) {
        console.log('Seeding SEO responses FAQs into MySQL table...');
        for (const f of this.state.faqs) {
          await this.pool.execute(
            'INSERT IGNORE INTO faqs (id, question, answer, parent_type, parent_id) VALUES (?, ?, ?, ?, ?)',
            [f.id, f.question, f.answer, f.parent_type, f.parent_id]
          );
        }
      }

      const [ratesRows]: any = await this.pool.execute('SELECT COUNT(*) as count FROM exchange_rates');
      if (ratesRows[0].count === 0) {
        console.log('Seeding exchange currency rates into MySQL table...');
        await this.pool.execute(
          'INSERT INTO exchange_rates (id, base, rates, updated_at) VALUES (?, ?, ?, ?)',
          [1, this.state.exchange_rates.base, JSON.stringify(this.state.exchange_rates.rates), this.state.exchange_rates.updated_at]
        );
      }

      const [settingsRows]: any = await this.pool.execute('SELECT COUNT(*) as count FROM settings');
      if (settingsRows[0].count === 0) {
        console.log('Seeding site settings layout into MySQL table...');
        const s = this.state.settings;
        await this.pool.execute(
          'INSERT INTO settings (id, site_name, site_title, meta_description, logo_url, google_analytics_id, ads_header, ads_sidebar, ads_between_content, ads_footer, company_name, company_phone, company_email, company_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [1, s.site_name, s.site_title, s.meta_description, s.logo_url || '', s.google_analytics_id || '', s.ads.header || '', s.ads.sidebar || '', s.ads.between_content || '', s.ads.footer || '', s.company_name || '', s.company_phone || '', s.company_email || '', s.company_address || '']
        );
      }

      // Reconcile and load latest database updates from MySQL to Cache memory
      console.log('Loading synchronized records back from MySQL...');
      const [users]: any = await this.pool.execute('SELECT * FROM users');
      const [categories]: any = await this.pool.execute('SELECT * FROM categories');
      const [articles]: any = await this.pool.execute('SELECT * FROM articles');
      const [faqs]: any = await this.pool.execute('SELECT * FROM faqs');
      const [rates]: any = await this.pool.execute('SELECT * FROM exchange_rates LIMIT 1');
      const [conversions]: any = await this.pool.execute('SELECT * FROM conversions ORDER BY id DESC LIMIT 100');
      const [visitors]: any = await this.pool.execute('SELECT * FROM visitors ORDER BY id DESC LIMIT 500');
      const [setRow]: any = await this.pool.execute('SELECT * FROM settings LIMIT 1');

      this.state = {
        users: users.map((u: any) => ({ id: u.id, username: u.username, password_hash: u.password_hash, role: u.role, name: u.name })),
        categories: categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })),
        articles: articles.map((a: any) => ({
          id: a.id, title: a.title, slug: a.slug, category_id: a.category_id, meta_title: a.meta_title,
          meta_description: a.meta_description, image_url: a.image_url, views: a.views, is_seo_page: Boolean(a.is_seo_page),
          created_at: a.created_at, content: a.content, formula: a.formula, example: a.example
        })),
        faqs: faqs.map((f: any) => ({ id: f.id, question: f.question, answer: f.answer, parent_type: f.parent_type, parent_id: f.parent_id })),
        exchange_rates: rates.length > 0 ? { base: rates[0].base, rates: JSON.parse(rates[0].rates), updated_at: rates[0].updated_at } : this.state.exchange_rates,
        conversions: conversions.map((c: any) => ({ id: c.id, type: c.type, from_unit: c.from_unit, to_unit: c.to_unit, from_value: c.from_value, to_value: c.to_value, created_at: c.created_at })).reverse(),
        visitors: visitors.map((v: any) => ({ id: v.id, ip: v.ip, user_agent: v.user_agent, path: v.path, visited_at: v.visited_at })).reverse(),
        settings: setRow.length > 0 ? {
          site_name: setRow[0].site_name,
          site_title: setRow[0].site_title,
          meta_description: setRow[0].meta_description,
          logo_url: setRow[0].logo_url,
          google_analytics_id: setRow[0].google_analytics_id,
          ads: {
            header: setRow[0].ads_header,
            sidebar: setRow[0].ads_sidebar,
            between_content: setRow[0].ads_between_content,
            footer: setRow[0].ads_footer
          },
          dark_mode_enabled: this.state.settings.dark_mode_enabled,
          default_lang: this.state.settings.default_lang,
          company_name: setRow[0].company_name,
          company_phone: setRow[0].company_phone,
          company_email: setRow[0].company_email,
          company_address: setRow[0].company_address
        } : this.state.settings
      };

      console.log('MySQL synchronizations loaded. Cache loaded with latest values!');
    } catch (err: any) {
      console.error('MySQL database loading schema failed. Memory cache remains standard backup:', err.message || err);
    }
  }

  // Getters
  getState() {
    return this.state;
  }

  getUsers() { return this.state.users; }

  addUser(user: { username: string; password_hash: string; role: 'admin' | 'user'; name: string }) {
    const nextId = this.state.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const newUser = { ...user, id: nextId };
    this.state.users.push(newUser);
    this.save();

    if (this.isMySQL && this.pool) {
      this.pool.execute(
        'INSERT INTO users (id, username, password_hash, role, name) VALUES (?, ?, ?, ?, ?)',
        [newUser.id, newUser.username, newUser.password_hash, newUser.role, newUser.name]
      ).catch(err => console.error('MySQL async addUser failed:', err));
    }

    return newUser;
  }

  setPassword(username: string, registeredName: string, passwordHash: string): boolean {
    const user = this.state.users.find(
      u => u.username.toLowerCase() === username.toLowerCase() &&
           u.name.toLowerCase().trim() === registeredName.toLowerCase().trim()
    );
    if (user) {
      user.password_hash = passwordHash;
      this.save();

      if (this.isMySQL && this.pool) {
        this.pool.execute(
          'UPDATE users SET password_hash = ? WHERE id = ?',
          [passwordHash, user.id]
        ).catch(err => console.error('MySQL async setPassword failed:', err));
      }
      return true;
    }
    return false;
  }

  getCategories() { return this.state.categories; }
  getArticles() { return this.state.articles; }
  getFAQs() { return this.state.faqs; }
  getExchangeRates() { return this.state.exchange_rates; }
  getConversions() { return this.state.conversions; }
  getVisitors() { return this.state.visitors; }
  getSettings() { return this.state.settings; }

  updateSettings(settings: SiteSettings) {
    this.state.settings = settings;
    this.save();

    if (this.isMySQL && this.pool) {
      this.pool.execute(
        'UPDATE settings SET site_name = ?, site_title = ?, meta_description = ?, logo_url = ?, google_analytics_id = ?, ads_header = ?, ads_sidebar = ?, ads_between_content = ?, ads_footer = ?, company_name = ?, company_phone = ?, company_email = ?, company_address = ? WHERE id = 1',
        [settings.site_name, settings.site_title, settings.meta_description, settings.logo_url || '', settings.google_analytics_id || '', settings.ads.header || '', settings.ads.sidebar || '', settings.ads.between_content || '', settings.ads.footer || '', settings.company_name || '', settings.company_phone || '', settings.company_email || '', settings.company_address || '']
      ).catch(err => console.error('MySQL async updateSettings failed:', err));
    }

    return this.state.settings;
  }

  addArticle(article: Omit<Article, 'id' | 'views' | 'created_at'>) {
    const nextId = this.state.articles.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    const newArticle: Article = {
      ...article,
      id: nextId,
      views: 0,
      created_at: new Date().toISOString()
    };
    this.state.articles.push(newArticle);
    this.save();

    if (this.isMySQL && this.pool) {
      this.pool.execute(
        'INSERT INTO articles (id, title, slug, category_id, meta_title, meta_description, image_url, views, is_seo_page, created_at, content, formula, example) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newArticle.id, newArticle.title, newArticle.slug, newArticle.category_id, newArticle.meta_title, newArticle.meta_description, newArticle.image_url, newArticle.views, newArticle.is_seo_page ? 1 : 0, newArticle.created_at, newArticle.content, newArticle.formula, newArticle.example]
      ).catch(err => console.error('MySQL async addArticle failed:', err));
    }

    return newArticle;
  }

  updateArticle(article: Article) {
    const idx = this.state.articles.findIndex(a => a.id === article.id);
    if (idx !== -1) {
      this.state.articles[idx] = article;
      this.save();

      if (this.isMySQL && this.pool) {
        this.pool.execute(
          'UPDATE articles SET title = ?, slug = ?, category_id = ?, meta_title = ?, meta_description = ?, image_url = ?, views = ?, is_seo_page = ?, content = ?, formula = ?, example = ? WHERE id = ?',
          [article.title, article.slug, article.category_id, article.meta_title, article.meta_description, article.image_url, article.views, article.is_seo_page ? 1 : 0, article.content, article.formula, article.example, article.id]
        ).catch(err => console.error('MySQL async updateArticle failed:', err));
      }

      return true;
    }
    return false;
  }

  deleteArticle(id: number) {
    this.state.articles = this.state.articles.filter(a => a.id !== id);
    this.save();

    if (this.isMySQL && this.pool) {
      this.pool.execute('DELETE FROM articles WHERE id = ?', [id])
        .catch(err => console.error('MySQL async deleteArticle failed:', err));
    }

    return true;
  }

  addCategory(name: string, slug: string) {
    const nextId = this.state.categories.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const cat = { id: nextId, name, slug };
    this.state.categories.push(cat);
    this.save();

    if (this.isMySQL && this.pool) {
      this.pool.execute(
        'INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)',
        [cat.id, cat.name, cat.slug]
      ).catch(err => console.error('MySQL async addCategory failed:', err));
    }

    return cat;
  }

  deleteCategory(id: number) {
    this.state.categories = this.state.categories.filter(c => c.id !== id);
    this.save();

    if (this.isMySQL && this.pool) {
      this.pool.execute('DELETE FROM categories WHERE id = ?', [id])
        .catch(err => console.error('MySQL async deleteCategory failed:', err));
    }

    return true;
  }

  addFAQ(faq: Omit<FAQ, 'id'>) {
    const nextId = this.state.faqs.reduce((max, f) => Math.max(max, f.id), 0) + 1;
    const f: FAQ = { ...faq, id: nextId };
    this.state.faqs.push(f);
    this.save();

    if (this.isMySQL && this.pool) {
      this.pool.execute(
        'INSERT INTO faqs (id, question, answer, parent_type, parent_id) VALUES (?, ?, ?, ?, ?)',
        [f.id, f.question, f.answer, f.parent_type, f.parent_id]
      ).catch(err => console.error('MySQL async addFAQ failed:', err));
    }

    return f;
  }

  deleteFAQ(id: number) {
    this.state.faqs = this.state.faqs.filter(f => f.id !== id);
    this.save();

    if (this.isMySQL && this.pool) {
      this.pool.execute('DELETE FROM faqs WHERE id = ?', [id])
        .catch(err => console.error('MySQL async deleteFAQ failed:', err));
    }

    return true;
  }

  updateExchangeRates(rates: Record<string, number>) {
    this.state.exchange_rates.rates = {
      ...this.state.exchange_rates.rates,
      ...rates
    };
    this.state.exchange_rates.updated_at = new Date().toISOString();
    this.save();

    if (this.isMySQL && this.pool) {
      this.pool.execute(
        'UPDATE exchange_rates SET rates = ?, updated_at = ? WHERE id = 1',
        [JSON.stringify(this.state.exchange_rates.rates), this.state.exchange_rates.updated_at]
      ).catch(err => console.error('MySQL async updateRates failed:', err));
    }

    return this.state.exchange_rates;
  }

  logConversion(type: string, from_unit: string, to_unit: string, from_value: number, to_value: number) {
    const nextId = this.state.conversions.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const newLog: ConversionLog = {
      id: nextId,
      type,
      from_unit,
      to_unit,
      from_value,
      to_value,
      created_at: new Date().toISOString()
    };
    this.state.conversions.push(newLog);
    if (this.state.conversions.length > 200) {
      this.state.conversions.shift();
    }
    this.save();

    if (this.isMySQL && this.pool) {
      this.pool.execute(
        'INSERT INTO conversions (id, type, from_unit, to_unit, from_value, to_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newLog.id, newLog.type, newLog.from_unit, newLog.to_unit, newLog.from_value, newLog.to_value, newLog.created_at]
      ).catch(err => console.error('MySQL async logConversion failed:', err));
    }

    return newLog;
  }

  logVisitor(ip: string, user_agent: string, path: string) {
    const nextId = this.state.visitors.reduce((max, v) => Math.max(max, v.id), 0) + 1;
    const log: VisitorLog = {
      id: nextId,
      ip,
      user_agent,
      path,
      visited_at: new Date().toISOString()
    };
    this.state.visitors.push(log);
    if (this.state.visitors.length > 500) {
      this.state.visitors.shift();
    }
    this.save();

    if (this.isMySQL && this.pool) {
      this.pool.execute(
        'INSERT INTO visitors (id, ip, user_agent, path, visited_at) VALUES (?, ?, ?, ?, ?)',
        [log.id, log.ip, log.user_agent, log.path, log.visited_at]
      ).catch(err => console.error('MySQL async logVisitor failed:', err));
    }

    return log;
  }

  incrementArticleViews(slug: string) {
    const article = this.state.articles.find(a => a.slug === slug);
    if (article) {
      article.views += 1;
      this.save();

      if (this.isMySQL && this.pool) {
        this.pool.execute(
          'UPDATE articles SET views = views + 1 WHERE slug = ?',
          [slug]
        ).catch(err => console.error('MySQL async incrementArticleViews failed:', err));
      }
    }
  }
}

export const db = new DBService();
