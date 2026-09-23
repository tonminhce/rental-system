#!/usr/bin/env python3
"""
High-performance crawler for Nha Tot / Cho Tot gateway API.
Collects rental listings across multiple regions and categories up to target count (e.g. 100k).
Deduplicates by list_id and saves progress incrementally.
"""
import os
import sys
import time
import random
import csv
import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "https://gateway.chotot.com/v1/public/ad-listing"
LIMIT = 50
MAX_PAGES_PER_QUERY = 200

CATEGORIES = [
    ("1050", "phong_tro"),
    ("1010", "can_ho_chung_cu"),
    ("1020", "nha_nguyen_can"),
    ("1040", "mat_bang_van_phong"),
]

REGIONS = [
    ("HCM", "13000"),
    ("Hanoi", "12000"),
    ("Danang", "3017"),
    ("BinhDuong", "2007"),
    ("DongNai", "5025"),
    ("CanTho", "5027"),
    ("HaiPhong", "1003"),
    ("KhanhHoa", "4019"),
    ("BaRiaVungTau", "5026"),
    ("LamDong", "4020"),
    ("QuangNam", "3018"),
    ("Hue", "3016"),
    ("NgheAn", "1005"),
    ("ThanhHoa", "1006"),
    ("BacNinh", "1002"),
    ("QuangNinh", "1004"),
    ("KienGiang", "5031"),
    ("LongAn", "5028"),
    ("TienGiang", "5029"),
    ("BinhDinh", "4022"),
]

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
]

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
# Timestamped per run — never append to / overwrite a previous run's CSV.
OUTPUT_FILE = os.path.join(OUTPUT_DIR, f"nhatot_rentals_{time.strftime('%Y%m%d_%H%M%S')}.csv")

session = requests.Session()
adapter = requests.adapters.HTTPAdapter(pool_connections=20, pool_maxsize=30, max_retries=3)
session.mount("https://", adapter)
session.mount("http://", adapter)

def fetch_page(category, region_code, page, retries=4):
    """Returns a list of ads, or None when still rate-limited after retries.
    None must NOT be counted as an empty page (that aborts the crawl early)."""
    offset = (page - 1) * LIMIT
    params = {
        "cg": category,
        "limit": LIMIT,
        "st": "u",
        "region_v2": region_code,
        "page": page,
        "o": offset,
    }
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "application/json",
        "Referer": "https://www.nhatot.com/",
    }
    rate_limited = False
    for attempt in range(retries):
        try:
            r = session.get(BASE_URL, params=params, headers=headers, timeout=12)
            if r.status_code == 200:
                return r.json().get("ads", [])
            if r.status_code == 429:
                rate_limited = True
                time.sleep((2 ** attempt) * 2 + random.random())  # exponential backoff
                continue
            print(f"[!] HTTP {r.status_code} on {category}/{region_code} p{page}")
            return []
        except Exception as e:
            print(f"[!] Network error on {category}/{region_code} p{page}: {e}")
            time.sleep(2 ** attempt)
    return None if rate_limited else []

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    target_count = int(sys.argv[1]) if len(sys.argv) > 1 else 100000
    print(f"=== Starting Nha Tot Crawler (Target: {target_count:,} listings) ===")

    seen_ids = set()

    # Load existing IDs from existing rental CSV files if present to prevent duplicates
    existing_files = [
        os.path.join(OUTPUT_DIR, f)
        for f in os.listdir(OUTPUT_DIR)
        if f.endswith(".csv") and "rental" in f
    ]
    for ef in existing_files:
        try:
            with open(ef, "r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    lid = row.get("list_id") or row.get("ad_id")
                    if lid:
                        seen_ids.add(str(lid))
        except Exception:
            pass

    print(f"[+] Loaded {len(seen_ids):,} existing listing IDs from local cache.")

    # CSV headers for standardized output
    fieldnames = [
        "list_id", "ad_id", "subject", "price", "price_string", "area", "size",
        "rooms", "toilets", "category", "category_name", "region_name", "area_name",
        "ward_name", "street_name", "longitude", "latitude", "image", "images",
        "body", "account_name", "account_id", "date", "source_url"
    ]

    file_exists = os.path.exists(OUTPUT_FILE)
    csv_file = open(OUTPUT_FILE, "a", newline="", encoding="utf-8")
    writer = csv.DictWriter(csv_file, fieldnames=fieldnames, extrasaction="ignore")
    if not file_exists:
        writer.writeheader()
        csv_file.flush()

    total_collected = len(seen_ids)
    seen_before_run = len(seen_ids)
    batch_buffer = []

    for cat_code, cat_name in CATEGORIES:
        for reg_name, reg_code in REGIONS:
            if total_collected >= target_count:
                break
            print(f"\n[*] Scanning Category: {cat_name} ({cat_code}) in {reg_name} (Code: {reg_code})...")

            with ThreadPoolExecutor(max_workers=8) as executor:
                futures = {
                    executor.submit(fetch_page, cat_code, reg_code, p): p
                    for p in range(1, MAX_PAGES_PER_QUERY + 1)
                }

                empty_pages = 0
                for future in as_completed(futures):
                    ads = future.result()
                    if ads is None:
                        # Rate-limited even after backoff retries — a gateway
                        # throttle is not an empty page, don't abort on it.
                        print(f"[!] page still rate-limited after retries, not counting as empty")
                        continue
                    if not ads:
                        empty_pages += 1
                        if empty_pages > 25:
                            break
                        continue

                    empty_pages = 0
                    new_items = 0
                    for ad in ads:
                        lid = str(ad.get("list_id") or ad.get("ad_id"))
                        if lid and lid not in seen_ids:
                            seen_ids.add(lid)
                            item = {
                                "list_id": lid,
                                "ad_id": ad.get("ad_id"),
                                "subject": ad.get("subject", ""),
                                "price": ad.get("price"),
                                "price_string": ad.get("price_string", ""),
                                "area": ad.get("area_name", ""),
                                "size": ad.get("size"),
                                "rooms": ad.get("rooms"),
                                "toilets": ad.get("toilets"),
                                "category": ad.get("category"),
                                "category_name": ad.get("category_name", ""),
                                "region_name": ad.get("region_name", ""),
                                "area_name": ad.get("area_name", ""),
                                "ward_name": ad.get("ward_name", ""),
                                "street_name": ad.get("street_name", ""),
                                "longitude": ad.get("longitude"),
                                "latitude": ad.get("latitude"),
                                "image": ad.get("image", ""),
                                "images": json.dumps(ad.get("images", [])),
                                "body": (ad.get("body") or "").replace("\n", " ")[:500],
                                "account_name": ad.get("account_name", ""),
                                "account_id": ad.get("account_id"),
                                "date": ad.get("date", ""),
                                "source_url": f"https://www.nhatot.com/{lid}.htm",
                            }
                            batch_buffer.append(item)
                            new_items += 1
                            total_collected += 1

                    if len(batch_buffer) >= 100:
                        writer.writerows(batch_buffer)
                        csv_file.flush()
                        batch_buffer.clear()
                        print(f"  -> Progress: {total_collected:,} / {target_count:,} listings collected (saved to {OUTPUT_FILE})")

                    if total_collected >= target_count:
                        break

            time.sleep(0.5)

    if batch_buffer:
        writer.writerows(batch_buffer)
        csv_file.flush()
        batch_buffer.clear()

    csv_file.close()
    new_in_run = total_collected - seen_before_run
    print(f"\n[✓] Finished crawling. New this run: {new_in_run:,} | total unique: {total_collected:,}")
    if new_in_run == 0:
        # ponytail: row-count exit code; real alerting when a scheduler exists
        print("[✗] FATAL: crawl produced 0 new rows — gateway blocked, selectors "
              "stale, or everything already seen", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
