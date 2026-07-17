"""Build the WhoSponsors serving database from raw USCIS H-1B Employer Data Hub CSVs.

Input:  data/raw/h1b_<year>.csv  (FY2009-FY2023, one row per employer/city/state slice)
Output: data/processed/h1b.db    (SQLite: companies, company_year)
        data/processed/top_companies.json (sample aggregate for the frontend)
"""

import json
import re
import sqlite3
from collections import Counter
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"

YEARS = range(2009, 2024)

# Legal-suffix noise stripped during normalization. Order matters: longer first.
SUFFIXES = (
    " INCORPORATED", " CORPORATION", " COMPANY", " LIMITED", " AMERICA INC",
    " USA INC", " US INC", " INC", " LLC", " LLP", " CORP", " LTD", " CO",
    " LP", " PC", " PLLC", " PLC", " NA", " USA", " US",
)

# Hand-curated aliases for companies whose filings are split across entities.
# normalized-name -> canonical key
ALIASES = {
    "GOOGLE": "GOOGLE",
    "GOOGLE COMMERCE": "GOOGLE",
    "AMAZONCOM SERVICES": "AMAZON",
    "AMAZON WEB SERVICES": "AMAZON",
    "AMAZONCOM": "AMAZON",
    "AMAZON DEVELOPMENT CENTER": "AMAZON",
    "AMAZON DATA SERVICES": "AMAZON",
    "META PLATFORMS": "META",
    "FACEBOOK": "META",
    "TATA CONSULTANCY SERVICES": "TATA CONSULTANCY SERVICES",
    "TATA CONSULTANCY SVCS": "TATA CONSULTANCY SERVICES",
    "COGNIZANT TECHNOLOGY SOLUTIONS": "COGNIZANT",
    "COGNIZANT TECH SOLUTIONS": "COGNIZANT",
    "COGNIZANT TECH SOLNS": "COGNIZANT",
    "COGNIZANT TECHNOLOGY SOLUTIONS U S": "COGNIZANT",
    "INFOSYS": "INFOSYS",
    "INFOSYS TECHNOLOGIES": "INFOSYS",
    "INFOSYS BPO": "INFOSYS",
    "HCL AMERICA": "HCL",
    "HCL TECHNOLOGIES": "HCL",
    "TECH MAHINDRA AMERICAS": "TECH MAHINDRA",
    "TECH MAHINDRA": "TECH MAHINDRA",
    "CAPGEMINI AMERICA": "CAPGEMINI",
    "CAPGEMINI US": "CAPGEMINI",
    "ERNST & YOUNG": "ERNST & YOUNG",
    "ERNST & YOUNG U S": "ERNST & YOUNG",
    "ALPHABET": "GOOGLE",
    "MICROSOFT OPERATIONS": "MICROSOFT",
    "APPLE COMPUTER": "APPLE",
    "NVIDIA": "NVIDIA",
    "INTERNATIONAL BUSINESS MACHINES": "IBM",
    "IBM": "IBM",
}


def normalize(name: str) -> str:
    if not isinstance(name, str):
        return ""
    n = name.upper().strip()
    n = re.sub(r"[^\w& ]", "", n)          # drop punctuation
    n = re.sub(r"\s+", " ", n).strip()
    changed = True
    while changed:
        changed = False
        for suf in SUFFIXES:
            if n.endswith(suf):
                n = n[: -len(suf)].strip()
                changed = True
    return ALIASES.get(n, n)


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def load_year(year: int) -> pd.DataFrame:
    df = pd.read_csv(
        RAW / f"h1b_{year}.csv",
        dtype=str,
        keep_default_na=False,
        encoding_errors="replace",
    )
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    # Column names drifted across years; map the known variants.
    renames = {
        "initial_approvals": "initial_approval",
        "initial_denials": "initial_denial",
        "continuing_approvals": "continuing_approval",
        "continuing_denials": "continuing_denial",
    }
    df = df.rename(columns=renames)
    for col in ("initial_approval", "initial_denial", "continuing_approval", "continuing_denial"):
        df[col] = pd.to_numeric(df[col].str.replace(",", ""), errors="coerce").fillna(0).astype(int)
    df["fiscal_year"] = int(year)
    df = df[df["employer"].str.strip() != ""]
    df["norm"] = df["employer"].map(normalize)
    df = df[df["norm"] != ""]
    return df[["fiscal_year", "employer", "norm", "state",
               "initial_approval", "initial_denial",
               "continuing_approval", "continuing_denial"]]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    frames = [load_year(y) for y in YEARS]
    df = pd.concat(frames, ignore_index=True)
    print(f"loaded {len(df):,} rows across {len(frames)} fiscal years")

    # Display name = most frequent raw spelling for each normalized company.
    display = (
        df.groupby("norm")["employer"]
        .agg(lambda s: Counter(s).most_common(1)[0][0])
        .rename("display_name")
    )

    agg = (
        df.groupby(["norm", "fiscal_year"])
        .agg(
            initial_approval=("initial_approval", "sum"),
            initial_denial=("initial_denial", "sum"),
            continuing_approval=("continuing_approval", "sum"),
            continuing_denial=("continuing_denial", "sum"),
        )
        .reset_index()
    )
    agg["total_approvals"] = agg["initial_approval"] + agg["continuing_approval"]
    agg["total_denials"] = agg["initial_denial"] + agg["continuing_denial"]

    companies = (
        agg.groupby("norm")
        .agg(all_time_approvals=("total_approvals", "sum"),
             all_time_denials=("total_denials", "sum"),
             first_year=("fiscal_year", "min"),
             last_year=("fiscal_year", "max"))
        .join(display)
        .reset_index()
        .sort_values("all_time_approvals", ascending=False)
        .reset_index(drop=True)
    )
    companies["company_id"] = companies.index + 1
    companies["slug"] = companies["display_name"].map(slugify)
    # De-dupe slug collisions by appending the id.
    dupes = companies["slug"].duplicated(keep="first")
    companies.loc[dupes, "slug"] = (
        companies.loc[dupes, "slug"] + "-" + companies.loc[dupes, "company_id"].astype(str)
    )

    agg = agg.merge(companies[["norm", "company_id"]], on="norm")

    db_path = OUT / "h1b.db"
    db_path.unlink(missing_ok=True)
    con = sqlite3.connect(db_path)
    companies[["company_id", "display_name", "slug", "norm",
               "all_time_approvals", "all_time_denials",
               "first_year", "last_year"]].to_sql("companies", con, index=False)
    agg[["company_id", "fiscal_year",
         "initial_approval", "initial_denial",
         "continuing_approval", "continuing_denial",
         "total_approvals", "total_denials"]].to_sql("company_year", con, index=False)
    con.executescript(
        """
        CREATE UNIQUE INDEX idx_companies_slug ON companies(slug);
        CREATE INDEX idx_companies_name ON companies(display_name);
        CREATE INDEX idx_cy_company ON company_year(company_id, fiscal_year);
        """
    )
    con.commit()

    top = companies.head(50)
    sample = []
    for _, c in top.iterrows():
        years = agg[agg["company_id"] == c["company_id"]].sort_values("fiscal_year")
        sample.append({
            "name": c["display_name"],
            "slug": c["slug"],
            "allTimeApprovals": int(c["all_time_approvals"]),
            "series": [
                {"year": int(r["fiscal_year"]),
                 "approvals": int(r["total_approvals"]),
                 "denials": int(r["total_denials"])}
                for _, r in years.iterrows()
            ],
        })
    (OUT / "top_companies.json").write_text(json.dumps(sample, indent=1))

    print(f"companies: {len(companies):,}")
    print(f"company_year rows: {len(agg):,}")
    print("top 10 all-time approvals:")
    print(companies[["display_name", "all_time_approvals"]].head(10).to_string(index=False))
    con.close()


if __name__ == "__main__":
    main()