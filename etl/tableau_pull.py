"""Pull FY2024+ H-1B employer data from the USCIS Tableau data hub.

USCIS stopped publishing static CSVs after FY2023; newer data lives only in a
Tableau viz. This drives the vizql session API directly:

  1. POST startSession/viewing  -> session id
  2. POST bootstrapSession      -> full data model (filter names + current rows)
  3. POST categorical-filter    -> switch fiscal year, re-read rows

The server (bigdataanalyticspub-sb.uscis.dhs.gov) is slow and 504s under load,
so every call retries with backoff. Output: data/raw/tableau_fy<year>.csv
"""

import csv
import json
import re
import sys
import time
from pathlib import Path

import requests

BASE = "https://bigdataanalyticspub-sb.uscis.dhs.gov"
WB, VIEW = "H1BEmployerDataHub-Final", "H1B-EmployerDataHub"
ROOT = f"{BASE}/vizql/w/{WB}/v/{VIEW}"
OUT = Path(__file__).resolve().parent.parent / "data" / "raw"

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}


def retry(fn, tries=8, base_delay=20):
    for i in range(tries):
        try:
            r = fn()
            if r.status_code == 200:
                return r
            print(f"  attempt {i+1}: HTTP {r.status_code}", flush=True)
        except requests.RequestException as e:
            print(f"  attempt {i+1}: {e}", flush=True)
        time.sleep(base_delay * (1.5 ** i))
    raise RuntimeError("all retries failed")


def parse_chunked(body: bytes):
    """bootstrap/command responses are `<len>;<json><len>;<json>...`"""
    out, i = [], 0
    while i < len(body):
        m = re.match(rb"(\d+);", body[i:])
        if not m:
            break
        n = int(m.group(1))
        start = i + m.end()
        out.append(json.loads(body[start : start + n]))
        i = start + n
    return out


def extract_rows(payload):
    """Pull the employer table out of a vizql data payload."""
    # dataDictionary: typed value pools; presModel holds column->pool indices.
    chunks = payload if isinstance(payload, list) else [payload]
    dicts, pres = None, None
    for c in chunks:
        seg = (
            c.get("secondaryInfo", {}).get("presModelMap")
            or c.get("vqlCmdResponse", {})
            .get("layoutStatus", {})
            .get("applicationPresModel", {})
            .get("dataDictionary", {})
            and c
        )
        if not seg:
            continue
        pm = c.get("secondaryInfo", {}).get("presModelMap")
        if pm:
            dicts = pm.get("dataDictionary", {}).get("presModelHolder", {}) \
                      .get("genDataDictionaryPresModel", {}).get("dataSegments", {})
            pres = pm.get("vizData", {}).get("presModelHolder", {}) \
                     .get("genPresModelMapPresModel", {}).get("presModelMap", {})
    if dicts is None:
        # command response variant
        for c in chunks:
            app = c.get("vqlCmdResponse", {}).get("layoutStatus", {}) \
                   .get("applicationPresModel", {})
            if app:
                dicts = app.get("dataDictionary", {}).get("dataSegments", {})
                zones = app.get("workbookPresModel", {}).get("dashboardPresModel", {}) \
                           .get("zones", {})
                pres = {
                    z.get("worksheet"): z.get("presModelHolder", {})
                    for z in zones.values()
                    if z.get("presModelHolder", {}).get("visual")
                }
    return dicts, pres


def pool(dicts):
    values = {}
    for seg in (dicts or {}).values():
        for col in seg.get("dataColumns", []):
            values.setdefault(col["dataType"], []).extend(col["dataValues"])
    return values


def rows_from_viz(pres_model_map, values):
    rows = []
    for sheet, holder in (pres_model_map or {}).items():
        visual = (
            holder.get("presModelHolder", {}).get("genVizDataPresModel", {})
            or holder.get("visual", {})
        )
        panes = (
            visual.get("paneColumnsData", {})
            if isinstance(visual, dict)
            else {}
        )
        if not panes:
            continue
        cols = panes.get("vizDataColumns", [])
        pane_cols = panes.get("paneColumnsList", [])
        col_series = []
        for c in cols:
            if "paneIndices" not in c or "columnIndices" not in c:
                continue
            pane = pane_cols[c["paneIndices"][0]]
            idxs = pane["vizPaneColumns"][c["columnIndices"][0]]["aliasIndices"]
            dt = c.get("dataType", "cstring")
            def resolve(i, dt=dt):
                # negative alias index -> display-value pool
                if i < 0:
                    return values.get("cstring", [None] * (-i))[-i - 1]
                return values.get(dt, [None] * (i + 1))[i]
            col_series.append((c.get("fieldCaption", "?"), [resolve(i) for i in idxs]))
        if col_series:
            rows.append((sheet, col_series))
    return rows


def main():
    ses = requests.Session()
    ses.headers.update(UA)

    print("1) startSession", flush=True)
    r = retry(lambda: ses.post(f"{ROOT}/startSession/viewing", timeout=120))
    sid = r.json()["sessionid"]
    print(f"   session {sid}", flush=True)

    print("2) bootstrapSession", flush=True)
    form = {
        "worksheetPortSize": '{"w":1400,"h":900}',
        "dashboardPortSize": '{"w":1400,"h":900}',
        "clientDimension": '{"w":1400,"h":900}',
        "renderMapsClientSide": "true",
        "isBrowserRendering": "true",
        "browserRenderingThreshold": "100",
        "formatDataValueLocally": "false",
        "navType": "Reload",
        "navSrc": "Top",
        "devicePixelRatio": "2",
        "clientRenderPixelLimit": "25000000",
        "sheet_id": VIEW,
        "showParams": '{"checkpoint":false,"refresh":false,"refreshUnmodified":false}',
        "filterTileSize": "200",
        "locale": "en_US",
        "language": "en",
        "verboseMode": "false",
        ":session_feature_flags": "{}",
        "keychain_version": "1",
    }
    r = retry(
        lambda: ses.post(
            f"{ROOT}/bootstrapSession/sessions/{sid}", data=form, timeout=300
        ),
        tries=6,
        base_delay=30,
    )
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "tableau_bootstrap.raw").write_bytes(r.content)
    chunks = parse_chunked(r.content)
    print(f"   {len(chunks)} chunks, {len(r.content):,} bytes", flush=True)

    dicts, pres = extract_rows(chunks)
    values = pool(dicts)
    print(f"   pools: { {k: len(v) for k, v in values.items()} }", flush=True)

    for sheet, cols in rows_from_viz(pres, values):
        n = max(len(s) for _, s in cols)
        path = OUT / f"tableau_{re.sub('[^A-Za-z0-9]+', '_', sheet).lower()}.csv"
        with open(path, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow([c for c, _ in cols])
            for i in range(n):
                w.writerow([s[i] if i < len(s) else "" for _, s in cols])
        print(f"   wrote {path.name}: {n} rows x {len(cols)} cols", flush=True)

    print("done — inspect CSVs, then extend with year-filter commands")


if __name__ == "__main__":
    main()
