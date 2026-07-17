# WhoSponsors

**The honest H-1B database.** Job postings say "visa sponsorship available" — filings say otherwise. WhoSponsors shows real USCIS approval and denial numbers for 324k+ employers (FY2009–FY2025), so international students and workers know who *actually* sponsors before applying.

## Usage

```bash
# 1. Build the database (downloads USCIS data, ~2 min)
make data && make build

# 2. Pull recent years from the USCIS Tableau hub (optional)
./etl/tableau_years.sh 2024 2025
python3 etl/merge_tableau.py 2024 2025

# 3. Run the site
cd web && npm install && npm run dev
```

Open http://localhost:3000 — search any company, get its approval/denial trend chart, denial rate, and year-over-year change.

## Data

- **FY2009–2023:** [USCIS H-1B Employer Data Hub](https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub) static CSVs — full detail, all employers.
- **FY2024+:** extracted from USCIS's Tableau dashboard (top employers, approvals only — labeled as partial in the UI).
- Employer name variants (`GOOGLE LLC` / `GOOGLE INC`) are merged via normalization + a curated alias table in `etl/build.py`.

## Stack

Python + pandas ETL → SQLite → Next.js + hand-rolled SVG charts. No external chart or API dependencies.

## Author

**Muzaffar Khaydarov** — [muzaffarkhaydarov.com](https://muzaffarkhaydarov.com) · [LinkedIn](https://www.linkedin.com/in/muzaffar-)

Not legal advice. Data belongs to USCIS; mistakes in merging are mine.
