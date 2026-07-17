import Database from 'better-sqlite3';
import path from 'path';

// The ETL output lives one level above web/ (see repo README).
const DB_PATH =
  process.env.H1B_DB_PATH ??
  path.join(process.cwd(), '..', 'data', 'processed', 'h1b.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  }
  return db;
}

export type Company = {
  company_id: number;
  display_name: string;
  slug: string;
  all_time_approvals: number;
  all_time_denials: number;
  first_year: number;
  last_year: number;
};

export type YearRow = {
  fiscal_year: number;
  initial_approval: number;
  initial_denial: number;
  continuing_approval: number;
  continuing_denial: number;
  total_approvals: number;
  total_denials: number;
};

export function searchCompanies(q: string, limit = 8): Company[] {
  const like = `%${q.trim().replace(/[%_]/g, ' ')}%`;
  return getDb()
    .prepare(
      `SELECT company_id, display_name, slug, all_time_approvals,
              all_time_denials, first_year, last_year
       FROM companies
       WHERE display_name LIKE ?
       ORDER BY all_time_approvals DESC
       LIMIT ?`
    )
    .all(like, limit) as Company[];
}

export function getCompanyBySlug(slug: string): Company | undefined {
  return getDb()
    .prepare(
      `SELECT company_id, display_name, slug, all_time_approvals,
              all_time_denials, first_year, last_year
       FROM companies WHERE slug = ?`
    )
    .get(slug) as Company | undefined;
}

export function getCompanySeries(companyId: number): YearRow[] {
  return getDb()
    .prepare(
      `SELECT fiscal_year, initial_approval, initial_denial,
              continuing_approval, continuing_denial,
              total_approvals, total_denials
       FROM company_year WHERE company_id = ?
       ORDER BY fiscal_year`
    )
    .all(companyId) as YearRow[];
}

export function getTopCompanies(limit = 20): Company[] {
  return getDb()
    .prepare(
      `SELECT company_id, display_name, slug, all_time_approvals,
              all_time_denials, first_year, last_year
       FROM companies ORDER BY all_time_approvals DESC LIMIT ?`
    )
    .all(limit) as Company[];
}