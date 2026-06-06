import fs from 'fs';
import path from 'path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { DatabaseState, User, Article, FAQ, ConversionLog, VisitorLog, SiteSettings } from '../types';
import { INITIAL_RATES, DEFAULT_CATEGORIES, DEFAULT_ARTICLES, DEFAULT_FAQS } from '../data';

const { Pool } = pg;
const FILE_PATH = path.join(process.cwd(), 'db.json');

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'ConvertHub',
  site_title: 'Precision Unit & Live Exchange Rates Platform',
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

const DEFAULT_USERS: User[] = [
  {
    id: 1,
    username: 'hamxak441@gmail.com',
    password_hash: bcrypt.hashSync('Ammir$1298', 10),
    role: 'user',
    name: 'Amir Khan',
    is_verified: true
  },
  {
    id: 2,
    username: 'admin@converthub.com',
    password_hash: bcrypt.hashSync('admin123', 10),
    role: 'user',
    name: 'Site admin',
    is_verified: true
  },
  {
    id: 3,
    username: 'user@converthub.com',
    password_hash: bcrypt.hashSync('user123', 10),
    role: 'user',
    name: 'Regular user',
    is_verified: true
  }
];

const DEFAULT_STATE: DatabaseState = {
  users: DEFAULT_USERS,
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
  private pool: pg.Pool | null = null;
  private isPostgres = false;

  constructor() {
    this.state = DEFAULT_STATE;
    this.loadStateFromFile();
    this.connectPostgreSQL();
  }

  private loadStateFromFile() {
    try {
      if (fs.existsSync(FILE_PATH)) {
        const raw = fs.readFileSync(FILE_PATH, 'utf-8');
        this.state = JSON.parse(raw);
        console.log('Successfully loaded state from local db.json fallback backup.');
      } else {
        this.saveStateToFile();
      }
    } catch (err) {
      console.warn('Could not read local backup db.json:', err);
    }
  }

  private saveStateToFile() {
    try {
      fs.writeFileSync(FILE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write database state to local db.json:', err);
    }
  }

  private async connectPostgreSQL() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      console.log('PostgreSQL database url is not provided. Running on standard file backup engine.');
      return;
    }

    try {
      console.log('Connecting to Neon PostgreSQL database...');
      this.pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
      });

      // Confirm pool reachability
      const client = await this.pool.connect();
      console.log('PostgreSQL Database Connected Successfully via connectionString!');
      client.release();
      this.isPostgres = true;

      await this.initPostgresTables();
    } catch (err: any) {
      console.error('Failed to connect to Neon PostgreSQL. Reverting to persistent file engine. Error:', err.message || err);
    }
  }

  private async initPostgresTables() {
    if (!this.pool) return;
    try {
      console.log('Initializing Postgres schema relations...');
      
      const sql_users = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255),
          role VARCHAR(50),
          name VARCHAR(255),
          is_verified BOOLEAN DEFAULT FALSE,
          verification_code VARCHAR(100),
          google_id VARCHAR(255)
        );
      `;
      const sql_categories = `
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          slug VARCHAR(255) UNIQUE
        );
      `;
      const sql_articles = `
        CREATE TABLE IF NOT EXISTS articles (
          id SERIAL PRIMARY KEY,
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
        );
      `;
      const sql_faqs = `
        CREATE TABLE IF NOT EXISTS faqs (
          id SERIAL PRIMARY KEY,
          question TEXT,
          answer TEXT,
          parent_type VARCHAR(100),
          parent_id VARCHAR(100)
        );
      `;
      const sql_exchange_rates = `
        CREATE TABLE IF NOT EXISTS exchange_rates (
          id SERIAL PRIMARY KEY,
          base VARCHAR(10),
          rates TEXT,
          updated_at VARCHAR(100)
        );
      `;
      const sql_conversions = `
        CREATE TABLE IF NOT EXISTS conversions (
          id SERIAL PRIMARY KEY,
          type VARCHAR(100),
          from_unit VARCHAR(100),
          to_unit VARCHAR(100),
          from_value DOUBLE PRECISION,
          to_value DOUBLE PRECISION,
          created_at VARCHAR(100)
        );
      `;
      const sql_visitors = `
        CREATE TABLE IF NOT EXISTS visitors (
          id SERIAL PRIMARY KEY,
          ip VARCHAR(100),
          user_agent TEXT,
          path VARCHAR(255),
          visited_at VARCHAR(100)
        );
      `;
      const sql_settings = `
        CREATE TABLE IF NOT EXISTS settings (
          id INT PRIMARY KEY,
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
        );
      `;

      await this.pool.query(sql_users);
      try {
        await this.pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at VARCHAR(100)");
        await this.pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255)");
        await this.pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(100)");
      } catch (err: any) {
        console.warn("Table alteration warning (standard if in SQLite backup mode):", err.message);
      }
      await this.pool.query(sql_categories);
      await this.pool.query(sql_articles);
      await this.pool.query(sql_faqs);
      await this.pool.query(sql_exchange_rates);
      await this.pool.query(sql_conversions);
      await this.pool.query(sql_visitors);
      await this.pool.query(sql_settings);

      console.log('PostgreSQL schema structures verified safely.');

      // Check users count
      const { rows: userRows } = await this.pool.query('SELECT COUNT(*) as count FROM users');
      if (parseInt(userRows[0].count) === 0) {
        console.log('Seeding default users into PostgreSQL database...');
        for (const u of DEFAULT_USERS) {
          await this.pool.query(
            'INSERT INTO users (id, username, password_hash, role, name, is_verified) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (username) DO NOTHING',
            [u.id, u.username, u.password_hash, u.role, u.name, u.is_verified || false]
          );
        }
        await this.syncSequence('users');
      } else {
        // Force update of preexisting seeded admins to regular users to respect user mandate
        await this.pool.query("UPDATE users SET role = 'user' WHERE username IN ('hamxak441@gmail.com', 'admin@converthub.com')");
      }

      // Check categories count
      const { rows: catRows } = await this.pool.query('SELECT COUNT(*) as count FROM categories');
      if (parseInt(catRows[0].count) === 0) {
        console.log('Seeding categories into PostgreSQL database...');
        for (const c of DEFAULT_CATEGORIES) {
          await this.pool.query(
            'INSERT INTO categories (id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING',
            [c.id, c.name, c.slug]
          );
        }
        await this.syncSequence('categories');
      }

      // Check articles count
      const { rows: artRows } = await this.pool.query('SELECT COUNT(*) as count FROM articles');
      if (parseInt(artRows[0].count) === 0) {
        console.log('Seeding articles into PostgreSQL database...');
        for (const a of DEFAULT_ARTICLES) {
          await this.pool.query(
            `INSERT INTO articles (id, title, slug, category_id, meta_title, meta_description, image_url, views, is_seo_page, created_at, content, formula, example)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (slug) DO NOTHING`,
            [a.id, a.title, a.slug, a.category_id, a.meta_title, a.meta_description, a.image_url, a.views, a.is_seo_page, a.created_at, a.content, a.formula, a.example]
          );
        }
        await this.syncSequence('articles');
      }

      // Check FAQs count
      const { rows: faqRows } = await this.pool.query('SELECT COUNT(*) as count FROM faqs');
      if (parseInt(faqRows[0].count) === 0) {
        console.log('Seeding FAQs into PostgreSQL database...');
        for (const f of DEFAULT_FAQS) {
          await this.pool.query(
            'INSERT INTO faqs (id, question, answer, parent_type, parent_id) VALUES ($1, $2, $3, $4, $5)',
            [f.id, f.question, f.answer, f.parent_type, f.parent_id]
          );
        }
        await this.syncSequence('faqs');
      }

      // Check Exchange Rates count
      const { rows: ratesRows } = await this.pool.query('SELECT COUNT(*) as count FROM exchange_rates');
      if (parseInt(ratesRows[0].count) === 0) {
        console.log('Seeding Exchange Rates into PostgreSQL database...');
        await this.pool.query(
          'INSERT INTO exchange_rates (id, base, rates, updated_at) VALUES ($1, $2, $3, $4)',
          [1, 'USD', JSON.stringify(INITIAL_RATES), new Date().toISOString()]
        );
        await this.syncSequence('exchange_rates');
      }

      // Check Settings count
      const { rows: settingsRows } = await this.pool.query('SELECT COUNT(*) as count FROM settings');
      if (parseInt(settingsRows[0].count) === 0) {
        console.log('Seeding Settings into PostgreSQL database...');
        const s = DEFAULT_SETTINGS;
        await this.pool.query(
          `INSERT INTO settings (id, site_name, site_title, meta_description, logo_url, google_analytics_id, ads_header, ads_sidebar, ads_between_content, ads_footer, company_name, company_phone, company_email, company_address)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [1, s.site_name, s.site_title, s.meta_description, s.logo_url, s.google_analytics_id, s.ads.header, s.ads.sidebar, s.ads.between_content, s.ads.footer, s.company_name, s.company_phone, s.company_email, s.company_address]
        );
      }

      // Reconcile and load latest database updates from PG to Cache Memory
      await this.reloadFromPostgre();

    } catch (err: any) {
      console.error('PostgreSQL database initialization failed. Cache remains default:', err.message || err);
    }
  }

  private async syncSequence(tableName: string) {
    if (!this.pool) return;
    try {
      await this.pool.query(`SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), COALESCE(MAX(id), 1)) FROM ${tableName}`);
    } catch (e: any) {
      console.warn(`Failed to sync sequence for ${tableName}:`, e.message);
    }
  }

  public async reloadFromPostgre() {
    if (!this.pool || !this.isPostgres) return;
    try {
      console.log('Loading synchronized records from PostgreSQL into memory...');
      const { rows: dbUsers } = await this.pool.query('SELECT * FROM users ORDER BY id ASC');
      const { rows: dbCategories } = await this.pool.query('SELECT * FROM categories ORDER BY id ASC');
      const { rows: dbArticles } = await this.pool.query('SELECT * FROM articles ORDER BY id ASC');
      const { rows: dbFaqs } = await this.pool.query('SELECT * FROM faqs ORDER BY id ASC');
      const { rows: dbRates } = await this.pool.query('SELECT * FROM exchange_rates WHERE id = 1');
      const { rows: dbConversions } = await this.pool.query('SELECT * FROM conversions ORDER BY id DESC LIMIT 100');
      const { rows: dbVisitors } = await this.pool.query('SELECT * FROM visitors ORDER BY id DESC LIMIT 500');
      const { rows: dbSettings } = await this.pool.query('SELECT * FROM settings WHERE id = 1');

      this.state = {
        users: dbUsers.map((u: any) => ({
          id: u.id,
          username: u.username,
          password_hash: u.password_hash,
          role: u.role,
          name: u.name,
          is_verified: u.is_verified,
          verification_code: u.verification_code,
          google_id: u.google_id,
          otp_expires_at: u.otp_expires_at,
          avatar_url: u.avatar_url,
          reset_code: u.reset_code
        })),
        categories: dbCategories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })),
        articles: dbArticles.map((a: any) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          category_id: a.category_id,
          meta_title: a.meta_title,
          meta_description: a.meta_description,
          image_url: a.image_url,
          views: a.views,
          is_seo_page: Boolean(a.is_seo_page),
          created_at: a.created_at,
          content: a.content,
          formula: a.formula,
          example: a.example
        })),
        faqs: dbFaqs.map((f: any) => ({ id: f.id, question: f.question, answer: f.answer, parent_type: f.parent_type, parent_id: f.parent_id })),
        exchange_rates: dbRates.length > 0 ? {
          base: dbRates[0].base,
          rates: typeof dbRates[0].rates === 'string' ? JSON.parse(dbRates[0].rates) : dbRates[0].rates,
          updated_at: dbRates[0].updated_at
        } : this.state.exchange_rates,
        conversions: dbConversions.map((c: any) => ({
          id: c.id,
          type: c.type,
          from_unit: c.from_unit,
          to_unit: c.to_unit,
          from_value: Number(c.from_value),
          to_value: Number(c.to_value),
          created_at: c.created_at
        })).reverse(),
        visitors: dbVisitors.map((v: any) => ({
          id: v.id,
          ip: v.ip,
          user_agent: v.user_agent,
          path: v.path,
          visited_at: v.visited_at
        })).reverse(),
        settings: dbSettings.length > 0 ? {
          site_name: dbSettings[0].site_name,
          site_title: dbSettings[0].site_title,
          meta_description: dbSettings[0].meta_description,
          logo_url: dbSettings[0].logo_url,
          google_analytics_id: dbSettings[0].google_analytics_id,
          ads: {
            header: dbSettings[0].ads_header || '',
            sidebar: dbSettings[0].ads_sidebar || '',
            between_content: dbSettings[0].ads_between_content || '',
            footer: dbSettings[0].ads_footer || ''
          },
          dark_mode_enabled: this.state.settings.dark_mode_enabled,
          default_lang: this.state.settings.default_lang,
          company_name: dbSettings[0].company_name || '',
          company_phone: dbSettings[0].company_phone || '',
          company_email: dbSettings[0].company_email || '',
          company_address: dbSettings[0].company_address || ''
        } : this.state.settings
      };

      console.log('State synchronized with Neon PostgreSQL data caching.');
      this.saveStateToFile();
    } catch (err: any) {
      console.error('Failed to load from PostgreSQL:', err.message);
    }
  }

  // Getters
  getState() { return this.state; }
  getUsers() { return this.state.users; }
  getCategories() { return this.state.categories; }
  getArticles() { return this.state.articles; }
  getFAQs() { return this.state.faqs; }
  getExchangeRates() { return this.state.exchange_rates; }
  getConversions() { return this.state.conversions; }
  getVisitors() { return this.state.visitors; }
  getSettings() { return this.state.settings; }

  // Action mutations synced to Postgres & Memory
  async registerUser(user: { name: string; username: string; password_plain: string; role: 'user' | 'admin' | 'super_admin' }) {
    const nextId = this.state.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const password_hash = bcrypt.hashSync(user.password_plain, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit email confirmation code
    const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    const newUser: User = {
      id: nextId,
      name: user.name,
      username: user.username,
      password_hash,
      role: user.role,
      is_verified: false,
      verification_code: code,
      otp_expires_at
    };

    // Remove any user with same username to prevent duplicate conflict in state array
    this.state.users = this.state.users.filter(u => u.username.toLowerCase() !== user.username.toLowerCase());
    this.state.users.push(newUser);
    this.saveStateToFile();

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO users (id, name, username, password_hash, role, is_verified, verification_code, otp_expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
           ON CONFLICT (username) DO UPDATE SET password_hash=$4, role=$5, name=$2, is_verified=FALSE, verification_code=$7, otp_expires_at=$8`,
          [newUser.id, newUser.name, newUser.username, newUser.password_hash, newUser.role, false, code, otp_expires_at]
        );
        await this.syncSequence('users');
      } catch (err) {
        console.error('Postgre Register err:', err);
      }
    }

    return newUser;
  }

  async verifyEmailCode(username: string, code: string): Promise<boolean> {
    const found = this.state.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.verification_code === code);
    if (found) {
      // Check for strict 10 minutes expiration
      if (found.otp_expires_at && new Date() > new Date(found.otp_expires_at)) {
        console.warn(`OTP code for ${username} is expired. Expiration was at ${found.otp_expires_at}`);
        return false;
      }

      found.is_verified = true;
      this.saveStateToFile();

      if (this.isPostgres && this.pool) {
        try {
          await this.pool.query('UPDATE users SET is_verified = TRUE WHERE username = $1', [username]);
        } catch (err) {
          console.error('Postgre Verify err:', err);
        }
      }
      return true;
    }
    return false;
  }

  // Regenerate OTP and update expiration (resend function)
  async resendOtpCode(username: string): Promise<string | null> {
    const found = this.state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (found) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      
      found.verification_code = code;
      found.otp_expires_at = otp_expires_at;
      this.saveStateToFile();

      if (this.isPostgres && this.pool) {
        try {
          await this.pool.query(
            'UPDATE users SET verification_code = $1, otp_expires_at = $2 WHERE username = $3',
            [code, otp_expires_at, username]
          );
        } catch (err) {
          console.error('Postmaster resend SQL err:', err);
        }
      }
      return code;
    }
    return null;
  }

  async googleAuth(name: string, email: string, googleId: string, avatarUrl?: string) {
    const lowercaseEmail = email.toLowerCase();
    const existing = this.state.users.find(u => u.username.toLowerCase() === lowercaseEmail);
    const syncAvatar = avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
    
    if (existing) {
      existing.is_verified = true;
      existing.google_id = googleId;
      existing.avatar_url = syncAvatar;
      this.saveStateToFile();

      if (this.isPostgres && this.pool) {
        try {
          await this.pool.query(
            'UPDATE users SET is_verified = TRUE, google_id = $1, avatar_url = $2 WHERE username = $3',
            [googleId, syncAvatar, lowercaseEmail]
          );
        } catch (err) {
          console.error('Postgre google update err:', err);
        }
      }
      return existing;
    }

    // Register Google member
    const nextId = this.state.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const randomPass = Math.random().toString(36).slice(-10);
    const password_hash = bcrypt.hashSync(randomPass, 10);

    const newUser: User = {
      id: nextId,
      name,
      username: lowercaseEmail,
      password_hash,
      role: 'user',
      is_verified: true,
      google_id: googleId,
      avatar_url: syncAvatar
    };

    this.state.users.push(newUser);
    this.saveStateToFile();

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO users (id, name, username, password_hash, role, is_verified, google_id, avatar_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [newUser.id, newUser.name, newUser.username, newUser.password_hash, newUser.role, true, googleId, syncAvatar]
        );
        await this.syncSequence('users');
      } catch (err) {
        console.error('Postgre google insert err:', err);
      }
    }

    return newUser;
  }

  async verifyPasswordUpdate(username: string, name: string, newPasswordPlain: string): Promise<boolean> {
    const found = this.state.users.find(
      u => u.username.toLowerCase() === username.toLowerCase() &&
           u.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (found) {
      const hash = bcrypt.hashSync(newPasswordPlain, 10);
      found.password_hash = hash;
      this.saveStateToFile();

      if (this.isPostgres && this.pool) {
        try {
          await this.pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, found.id]);
        } catch (err) {
          console.error('Postgre setPassword err:', err);
        }
      }
      return true;
    }

    return false;
  }

  async generatePasswordResetOtp(username: string): Promise<string | null> {
    const found = this.state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (found) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now
      found.reset_code = code;
      found.otp_expires_at = expires;
      this.saveStateToFile();

      if (this.isPostgres && this.pool) {
        try {
          await this.pool.query(
            "UPDATE users SET reset_code = $1, otp_expires_at = $2 WHERE id = $3",
            [code, expires, found.id]
          );
        } catch (err) {
          console.error("Postgre setResetCode err:", err);
        }
      }
      return code;
    }
    return null;
  }

  async applyPasswordResetWithOtp(username: string, code: string, newPasswordPlain: string): Promise<boolean> {
    const found = this.state.users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.reset_code === code
    );
    if (found) {
      // Check code expiration
      if (found.otp_expires_at && new Date() > new Date(found.otp_expires_at)) {
        console.warn("Reset OTP has expired.");
        return false;
      }

      const hash = bcrypt.hashSync(newPasswordPlain, 10);
      found.password_hash = hash;
      // Clear reset code
      found.reset_code = undefined;
      this.saveStateToFile();

      if (this.isPostgres && this.pool) {
        try {
          await this.pool.query(
            "UPDATE users SET password_hash = $1, reset_code = NULL WHERE id = $2",
            [hash, found.id]
          );
        } catch (err) {
          console.error("Postgre apply reset password err:", err);
        }
      }
      return true;
    }
    return false;
  }

  async updateSettings(settings: SiteSettings) {
    this.state.settings = settings;
    this.saveStateToFile();

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query(
          `UPDATE settings SET site_name = $1, site_title = $2, meta_description = $3, logo_url = $4, google_analytics_id = $5,
           ads_header = $6, ads_sidebar = $7, ads_between_content = $8, ads_footer = $9, company_name = $10,
           company_phone = $11, company_email = $12, company_address = $13 WHERE id = 1`,
          [
            settings.site_name,
            settings.site_title,
            settings.meta_description,
            settings.logo_url || '',
            settings.google_analytics_id || '',
            settings.ads.header || '',
            settings.ads.sidebar || '',
            settings.ads.between_content || '',
            settings.ads.footer || '',
            settings.company_name || '',
            settings.company_phone || '',
            settings.company_email || '',
            settings.company_address || ''
          ]
        );
      } catch (err) {
        console.error('Postgre updateSettings err:', err);
      }
    }

    return this.state.settings;
  }

  async updateExchangeRates(rates: Record<string, number>) {
    this.state.exchange_rates.rates = {
      ...this.state.exchange_rates.rates,
      ...rates
    };
    this.state.exchange_rates.updated_at = new Date().toISOString();
    this.saveStateToFile();

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query(
          'UPDATE exchange_rates SET rates = $1, updated_at = $2 WHERE id = 1',
          [JSON.stringify(this.state.exchange_rates.rates), this.state.exchange_rates.updated_at]
        );
      } catch (err) {
        console.error('Postgre updateExchangeRates err:', err);
      }
    }

    return this.state.exchange_rates;
  }

  async addArticle(article: Omit<Article, 'id' | 'views' | 'created_at'>) {
    const nextId = this.state.articles.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    const newArticle: Article = {
      ...article,
      id: nextId,
      views: 0,
      created_at: new Date().toISOString()
    };
    this.state.articles.push(newArticle);
    this.saveStateToFile();

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO articles (id, title, slug, category_id, meta_title, meta_description, image_url, views, is_seo_page, created_at, content, formula, example)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            newArticle.id,
            newArticle.title,
            newArticle.slug,
            newArticle.category_id,
            newArticle.meta_title,
            newArticle.meta_description,
            newArticle.image_url,
            newArticle.views,
            newArticle.is_seo_page,
            newArticle.created_at,
            newArticle.content,
            newArticle.formula,
            newArticle.example
          ]
        );
        await this.syncSequence('articles');
      } catch (err) {
        console.error('Postgre addArticle err:', err);
      }
    }

    return newArticle;
  }

  async updateArticle(article: Article) {
    const idx = this.state.articles.findIndex(a => a.id === article.id);
    if (idx !== -1) {
      this.state.articles[idx] = article;
      this.saveStateToFile();

      if (this.isPostgres && this.pool) {
        try {
          await this.pool.query(
            `UPDATE articles SET title = $1, slug = $2, category_id = $3, meta_title = $4, meta_description = $5,
             image_url = $6, views = $7, is_seo_page = $8, content = $9, formula = $10, example = $11 WHERE id = $12`,
            [
              article.title,
              article.slug,
              article.category_id,
              article.meta_title,
              article.meta_description,
              article.image_url,
              article.views,
              article.is_seo_page,
              article.content,
              article.formula,
              article.example,
              article.id
            ]
          );
        } catch (err) {
          console.error('Postgre updateArticle err:', err);
        }
      }
      return true;
    }
    return false;
  }

  async deleteArticle(id: number) {
    this.state.articles = this.state.articles.filter(a => a.id !== id);
    this.saveStateToFile();

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query('DELETE FROM articles WHERE id = $1', [id]);
      } catch (err) {
        console.error('Postgre deleteArticle err:', err);
      }
    }

    return true;
  }

  async addCategory(name: string, slug: string) {
    const nextId = this.state.categories.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const cat = { id: nextId, name, slug };
    this.state.categories.push(cat);
    this.saveStateToFile();

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query(
          'INSERT INTO categories (id, name, slug) VALUES ($1, $2, $3)',
          [cat.id, cat.name, cat.slug]
        );
        await this.syncSequence('categories');
      } catch (err) {
        console.error('Postgre addCategory err:', err);
      }
    }

    return cat;
  }

  async deleteCategory(id: number) {
    this.state.categories = this.state.categories.filter(c => c.id !== id);
    this.saveStateToFile();

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query('DELETE FROM categories WHERE id = $1', [id]);
      } catch (err) {
        console.error('Postgre deleteCategory err:', err);
      }
    }

    return true;
  }

  async addFAQ(faq: Omit<FAQ, 'id'>) {
    const nextId = this.state.faqs.reduce((max, f) => Math.max(max, f.id), 0) + 1;
    const f: FAQ = { ...faq, id: nextId };
    this.state.faqs.push(f);
    this.saveStateToFile();

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query(
          'INSERT INTO faqs (id, question, answer, parent_type, parent_id) VALUES ($1, $2, $3, $4, $5)',
          [f.id, f.question, f.answer, f.parent_type, f.parent_id]
        );
        await this.syncSequence('faqs');
      } catch (err) {
        console.error('Postgre addFAQ err:', err);
      }
    }

    return f;
  }

  async deleteFAQ(id: number) {
    this.state.faqs = this.state.faqs.filter(f => f.id !== id);
    this.saveStateToFile();

    if (this.isPostgres && this.pool) {
      try {
        await this.pool.query('DELETE FROM faqs WHERE id = $1', [id]);
      } catch (err) {
        console.error('Postgre deleteFAQ err:', err);
      }
    }

    return true;
  }

  async logConversion(type: string, from_unit: string, to_unit: string, from_value: number, to_value: number) {
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
    this.saveStateToFile();

    if (this.isPostgres && this.pool) {
      try {
        const res = await this.pool.query(
          'INSERT INTO conversions (type, from_unit, to_unit, from_value, to_value, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [newLog.type, newLog.from_unit, newLog.to_unit, newLog.from_value, newLog.to_value, newLog.created_at]
        );
        if (res.rows && res.rows[0]) {
          newLog.id = res.rows[0].id;
        }
      } catch (err) {
        console.error('Postgre logConversion err:', err);
      }
    }

    return newLog;
  }

  async logVisitor(ip: string, user_agent: string, path: string) {
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
    this.saveStateToFile();

    if (this.isPostgres && this.pool) {
      try {
        const res = await this.pool.query(
          'INSERT INTO visitors (ip, user_agent, path, visited_at) VALUES ($1, $2, $3, $4) RETURNING id',
          [log.ip, log.user_agent, log.path, log.visited_at]
        );
        if (res.rows && res.rows[0]) {
          log.id = res.rows[0].id;
        }
      } catch (err) {
        console.error('Postgre logVisitor err:', err);
      }
    }

    return log;
  }

  public async switchToDynamicNeon(dbUrl: string): Promise<{ success: boolean; host: string; dbname: string; tables: number }> {
    try {
      console.log('Switching active pool to user provided Neon Database URL...');
      const tempPool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
      });

      // Confirm pool reachability
      const client = await tempPool.connect();
      console.log('Dynamic user Neon credentials validated successfully!');
      client.release();

      // Successfully connected! Change active pool
      const oldPool = this.pool;
      this.pool = tempPool;
      this.isPostgres = true;

      // Close the old pool in background to avoid leak
      if (oldPool) {
        oldPool.end().catch((err: any) => console.warn('Old pool shutdown warning:', err.message));
      }

      // Initialize the schemas on this new DB if required
      await this.initPostgresTables();

      // Parse connection details for display
      let host = 'unknown-host';
      let dbname = 'neondb';
      try {
        const u = new URL(dbUrl);
        host = u.hostname;
        dbname = u.pathname.substring(1) || 'neondb';
      } catch {}

      // Query active table count
      let tables = 0;
      try {
        const result = await this.pool.query(
          "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
        );
        tables = parseInt(result.rows[0].count);
      } catch {}

      return { success: true, host, dbname, tables };
    } catch (err: any) {
      console.error('Dynamic Neon switch failed:', err.message);
      throw err;
    }
  }

  async incrementArticleViews(slug: string) {
    const article = this.state.articles.find(a => a.slug === slug);
    if (article) {
      article.views += 1;
      this.saveStateToFile();

      if (this.isPostgres && this.pool) {
        try {
          await this.pool.query('UPDATE articles SET views = views + 1 WHERE slug = $1', [slug]);
        } catch (err) {
          console.error('Postgre incrementArticleViews err:', err);
        }
      }
    }
  }
}

export const db = new DBService();
