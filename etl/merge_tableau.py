"""Merge Tableau-pulled fiscal years (FY2024+) into the serving DB.

Input:  data/raw/tableau_fy<year>.csv  (Employer Name, Rank, Total Approvals)
        — top-100 employers per year, approvals only (denials unavailable).
Output: rows appended to company_year in data/processed/h1b.db, matched to
        existing companies via the same normalization as build.py. A `coverage`
        table records which years are partial so the frontend can label them.

Run build.py first; then this. Idempotent per year (delete+insert).
"""

import csv
import sqlite3
import sys
from pathlib import Path

from build import normalize  # same entity resolution as the base build

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
DB = ROOT / "data" / "processed" / "h1b.db"


def read_year(year: int):
    path = RAW / f"tableau_fy{year}.csv"
    if not path.exists():
        raise SystemExit(f"missing {path} — run tableau_years.sh {year} first")
    rows = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            name = (r.get("Employer (Petitioner) Name") or "").strip()
            appr = (r.get("Total Approvals") or "0").replace(",", "").strip()
            if name and appr.isdigit():
                rows.append((name, int(appr)))
    if not rows:
        raise SystemExit(f"{path} parsed to 0 rows — inspect it")
    return rows


def main(years):
    con = sqlite3.connect(DB)
    con.executescript(
        """
        CREATE TABLE IF NOT EXISTS coverage (
            fiscal_year INTEGER PRIMARY KEY,
            source TEXT,
            note TEXT
        );
        """
    )
    lookup = {
        norm: cid
        for cid, norm in con.execute("SELECT company_id, norm FROM companies")
    }

    for year in years:
        rows = read_year(year)
        matched, missed = 0, []
        con.execute("DELETE FROM company_year WHERE fiscal_year = ?", (year,))
        for name, approvals in rows:
            cid = lookup.get(normalize(name))
            if cid is None:
                missed.append(name)
                continue
            con.execute(
                """INSERT INTO company_year
                   (company_id, fiscal_year, initial_approval, initial_denial,
                    continuing_approval, continuing_denial,
                    total_approvals, total_denials)
                   VALUES (?, ?, NULL, NULL, NULL, NULL, ?, NULL)""",
                (cid, year, approvals),
            )
            matched += 1
        con.execute(
            """INSERT OR REPLACE INTO coverage (fiscal_year, source, note)
               VALUES (?, 'uscis-tableau',
                       'Top employers only; approvals only (denials not published)')""",
            (year,),
        )
        con.execute(
            """UPDATE companies SET last_year = ?
               WHERE company_id IN
                 (SELECT company_id FROM company_year WHERE fiscal_year = ?)
                 AND last_year < ?""",
            (year, year, year),
        )
        print(f"FY{year}: {matched}/{len(rows)} matched", flush=True)
        for name in missed:
            print(f"  unmatched: {name}", flush=True)

    con.commit()
    con.close()


if __name__ == "__main__":
    main([int(y) for y in sys.argv[1:]] or [2024, 2025])