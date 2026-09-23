#!/usr/bin/env python
"""One authoritative training script for the mogi price-prediction service.

Supersedes website_scraper/models/price_predicting_model.{py,ipynb} (deleted).
Reads every mogi_after_parsing*.csv in the crawler root plus the nhatot
rental CSVs in nhatot-crawler/data/, cleans labels, trains a RandomForest,
and writes the serving contract artifacts into server/models/:

    re_model.pkl, label_encoder.pkl, model_meta.json

Target unit: triệu VND/month (same unit the old pipeline used).
Run:  crawlers-venv/bin/python mogi-crawler/server/train.py
"""

import glob
import json
import os
import pickle
import sys
from datetime import datetime, timezone

import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, median_absolute_error, r2_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import LabelEncoder

from utils import standardize_district, standardize_province, standardize_ward

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)  # mogi-crawler/
REPO = os.path.dirname(ROOT)
MODELS_DIR = os.path.join(HERE, "models")
NHATOT_DATA = os.path.join(REPO, "nhatot-crawler", "data")

FEATURES = [
    "province",
    "district",
    "ward",
    "location_latitude",
    "location_longitude",
    "area",
    "bedrooms",
    "bathrooms",
]
# Vietnam bounding box — rows outside are corrupt (historically lat/lon were
# swapped end-to-end; the swap is repaired below, then bounds are enforced).
VN_LAT = (8.0, 24.0)  # mainland VN spans ~8.2–23.4; catches lat/lon swaps
VN_LON = (102.0, 110.0)
MAX_PRICE_TRIEU = 1000.0  # 1 billion VND/month is not a rental listing


def load_mogi():
    """All timestamped (and legacy) mogi crawl outputs. Price already in triệu."""
    frames = []
    for path in sorted(glob.glob(os.path.join(ROOT, "mogi_after_parsing*.csv"))):
        df = pd.read_csv(path)
        # One-off repair: old crawls wrote longitude into location_latitude
        # (spider built GeoJSON-ordered coords and the pipeline mis-mapped
        # them). Detect by range, per file, and swap back. The spider is
        # fixed, so new files never trigger this.
        if df["location_latitude"].median() > 50:
            df[["location_latitude", "location_longitude"]] = df[
                ["location_longitude", "location_latitude"]
            ].to_numpy()
            print(f"[mogi] {os.path.basename(path)}: swapped lat/lon columns")
        frames.append(df[FEATURES + ["price"]])
        print(f"[mogi] {os.path.basename(path)}: {len(df)} rows")
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()


def load_nhatot():
    """chotot/nhatot rental CSVs. API price is VND → convert to triệu."""
    paths = sorted(
        glob.glob(os.path.join(NHATOT_DATA, "nhatot_rentals_*.csv"))
        + glob.glob(os.path.join(NHATOT_DATA, "nhatot_100k_combined.csv"))
    )
    if not paths:
        return pd.DataFrame()
    df = pd.concat([pd.read_csv(p) for p in paths], ignore_index=True)
    print(f"[nhatot] {len(paths)} file(s), {len(df)} raw rows")
    df = df.drop_duplicates(subset=["list_id"], keep="first")
    out = pd.DataFrame(
        {
            "province": df["region_name"].fillna("").astype(str).map(standardize_province),
            "district": df["area_name"].fillna("").astype(str).map(standardize_district),
            "ward": df["ward_name"].fillna("").astype(str).map(standardize_ward),
            "location_latitude": pd.to_numeric(df["latitude"], errors="coerce"),
            "location_longitude": pd.to_numeric(df["longitude"], errors="coerce"),
            "area": pd.to_numeric(df["size"], errors="coerce"),
            "bedrooms": pd.to_numeric(df["rooms"], errors="coerce").fillna(0),
            "bathrooms": pd.to_numeric(df["toilets"], errors="coerce").fillna(0),
            "price": pd.to_numeric(df["price"], errors="coerce") / 1e6,
        }
    )
    return out


def clean(df, label):
    n0 = len(df)
    df = df.dropna(subset=FEATURES + ["price"])
    df = df[(df["price"] > 0) & (df["price"] <= MAX_PRICE_TRIEU)]
    df = df[(df["area"] > 0) & (df["area"] <= 2000)]
    bad = ~(
        df["location_latitude"].between(*VN_LAT)
        & df["location_longitude"].between(*VN_LON)
    )
    if bad.any():
        print(f"[{label}] rejecting {int(bad.sum())} rows outside VN bounds "
              f"lat{VN_LAT} lon{VN_LON}")
    df = df[~bad]
    for col in ("province", "district", "ward"):
        values = df[col].astype(str).str.strip()
        df = df[(values != "") & (values.str.lower() != "nan")]
    df = df.drop_duplicates(subset=FEATURES + ["price"])
    print(f"[{label}] {n0} -> {len(df)} usable rows")
    return df


def main():
    mogi = clean(load_mogi(), "mogi")
    nhatot = load_nhatot()
    nhatot = clean(nhatot, "nhatot") if not nhatot.empty else nhatot
    df = pd.concat([mogi, nhatot], ignore_index=True)
    if len(df) < 50:
        sys.exit(
            f"FATAL: only {len(df)} usable rows on disk — crawl first "
            "(mogi-crawler/run_crawl.sh, nhatot-crawler/run_crawl.sh) or "
            "restore nhatot-crawler/data/*.csv"
        )

    # Group-aware split by district: a crawl snapshot is duplicate-heavy and
    # geographically clustered, so a random split leaks (review: KNN n=1
    # "won" the old grid search). Whole districts are held out.
    groups = df["district"].astype(str)
    X = df[FEATURES].copy()
    y = df["price"]
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    X_train, X_test = X.iloc[train_idx].copy(), X.iloc[test_idx].copy()
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
    print(f"split by district: train={len(X_train)} "
          f"({groups.iloc[train_idx].nunique()} districts) "
          f"test={len(X_test)} ({groups.iloc[test_idx].nunique()} districts), "
          f"no district overlap={not set(groups.iloc[train_idx]) & set(groups.iloc[test_idx])}")

    encoders = {}
    for feature in ("province", "district", "ward"):
        le = LabelEncoder()
        le.fit(df[feature].astype(str))  # fit on all rows so serving knows every seen value
        X_train[feature] = le.transform(X_train[feature].astype(str))
        X_test[feature] = le.transform(X_test[feature].astype(str))
        encoders[f"le_{feature}"] = le

    model = RandomForestRegressor(
        n_estimators=200, random_state=42, n_jobs=-1, min_samples_leaf=5
    )
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    metrics = {
        "mae_trieu": round(float(mean_absolute_error(y_test, pred)), 3),
        "median_ae_trieu": round(float(median_absolute_error(y_test, pred)), 3),
        "r2": round(float(r2_score(y_test, pred)), 4),
    }
    print("held-out districts:", metrics)

    os.makedirs(MODELS_DIR, exist_ok=True)
    with open(os.path.join(MODELS_DIR, "re_model.pkl"), "wb") as f:
        pickle.dump(model, f)
    with open(os.path.join(MODELS_DIR, "label_encoder.pkl"), "wb") as f:
        pickle.dump(encoders, f)
    meta = {
        "features": FEATURES,
        "sklearn_version": sklearn.__version__,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "target_unit": "triệu VND/month",
        "n_rows": int(len(df)),
        "split": "GroupShuffleSplit by district",
        "metrics": metrics,
    }
    with open(os.path.join(MODELS_DIR, "model_meta.json"), "w") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"saved artifacts to {MODELS_DIR} (sklearn {sklearn.__version__})")


if __name__ == "__main__":
    main()
