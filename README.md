# WhoSponsors

The honest H-1B sponsorship database. Search any company, see who *actually* sponsors:
approvals and denials per year (FY2009–FY2023), built from official USCIS data.

## Data pipeline

```
make data     # download 15 years of USCIS H-1B Employer Data Hub CSVs
make build    # ETL -> data/processed/h1b.db (SQLite) + top_companies.json
```

- **Source:** [USCIS H-1B Employer Data Hub](https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub) — one row per employer/year with initial/continuing approvals and denials.
- **Entity resolution:** employer names are normalized (case, punctuation, legal suffixes) and merged via a curated alias table (`ALIASES` in `etl/build.py`) so `COGNIZANT TECH SOLNS US CORP` and `COGNIZANT TECHNOLOGY SOLUTIONS` count as one company. ~325k distinct employers after merging.
- **Output schema:**
  - `companies(company_id, display_name, slug, norm, all_time_approvals, all_time_denials, first_year, last_year)`
  - `company_year(company_id, fiscal_year, initial_approval, initial_denial, continuing_approval, continuing_denial, total_approvals, total_denials)`

## Roadmap

- [x] Phase 1: USCIS data hub ETL → clean `company_year` table
- [ ] FY2024+ data (only exposed via the interactive hub API — needs endpoint discovery)
- [ ] Phase 2: DOL LCA disclosure files → salaries, job titles, locations
- [ ] Phase 3: PERM (green card) data, OG share images, "top movers" leaderboard
- [ ] Frontend: Next.js search + company trend pages

## Requirements

Python 3.11+, `pandas`. Frontend TBD (Next.js).