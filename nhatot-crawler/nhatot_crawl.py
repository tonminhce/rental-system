import json
import os
import sys

import requests
import pandas as pd
import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from requests.exceptions import RequestException

# === Configuration ===
BASE_URL = "https://gateway.chotot.com/v1/public/ad-listing"
CATEGORY = "1020"  # Room rental
REGIONS = {"HCM": "13000", "Hanoi": "12000", "Danang": "3017", "CanTho": "5027"}
MAX_PAGES = 200  # Max pages per region
LIMIT = 50  # Listings per page
SAVE_INTERVAL = 50  # Save temporary CSV every N pages
THREADS = 10  # Number of threads

# List of random user-agents to avoid getting blocked
HEADERS_LIST = [
    {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/..."},
    {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/..."},
    {"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/..."},
]


RUN_TS = time.strftime("%Y%m%d_%H%M%S")
SEEN_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "seen_ids.json")


# Function to fetch a single page of data
def get_data(region_code, page, retries=4):
    offset = (page - 1) * LIMIT
    params = {
        "cg": CATEGORY,
        "limit": LIMIT,
        "st": "s",  # Sorted by newest
        "region_v2": region_code,
        "page": page,
        "o": offset,
    }
    headers = random.choice(HEADERS_LIST)

    for attempt in range(retries):
        try:
            response = requests.get(BASE_URL, params=params, headers=headers, timeout=10)
            if response.status_code == 200:
                ads = response.json().get("ads", [])
                print(f"[✓] Page {page} fetched with {len(ads)} ads.")
                return ads
            if response.status_code == 429:
                time.sleep((2 ** attempt) * 2 + random.random())  # exponential backoff
                continue
            print(f"[!] HTTP Error {response.status_code} on page {page}")
            return []
        except RequestException as e:
            print(f"[!] Network error on page {page}: {e}")
            time.sleep(2 ** attempt)
    print(f"[!] Giving up on page {page} after {retries} retries")
    return []


def load_seen():
    try:
        with open(SEEN_FILE, encoding="utf-8") as f:
            return set(json.load(f))
    except (FileNotFoundError, ValueError):
        return set()


# === Start crawling ===
os.makedirs(os.path.dirname(SEEN_FILE), exist_ok=True)
seen_ids = load_seen()
print(f"[+] Loaded {len(seen_ids):,} previously seen listing IDs from {SEEN_FILE}")
total_new = 0

for region_name, region_code in REGIONS.items():
    print(f"=== Crawling data for region: {region_name} ===")
    all_data = []

    # Use multithreading to fetch pages in parallel
    with ThreadPoolExecutor(max_workers=THREADS) as executor:
        # Submit all pages as tasks
        futures = {
            executor.submit(get_data, region_code, page): page
            for page in range(1, MAX_PAGES + 1)
        }

        for count, future in enumerate(as_completed(futures), 1):
            ads = future.result()
            for ad in ads:
                # Cross-run dedup: skip listings already persisted by a
                # previous crawl (state: data/seen_ids.json, gitignored).
                aid = str(ad.get("list_id") or ad.get("ad_id") or "")
                if not aid or aid in seen_ids:
                    continue
                seen_ids.add(aid)
                all_data.append(ad)
                total_new += 1

            # Save checkpoint every N pages
            if count % SAVE_INTERVAL == 0 and all_data:
                df = pd.DataFrame(all_data)
                temp_filename = f"data/data_{region_name}_{RUN_TS}_p{count}.csv"
                df.to_csv(temp_filename, index=False, encoding="utf-8")
                print(f"[✓] Saved checkpoint: {temp_filename}")

    # Save final CSV after region is fully crawled (timestamped — never
    # overwrite a previous run's training CSV)
    if all_data:
        df = pd.DataFrame(all_data)
        final_filename = f"phongtro_{region_name}_{RUN_TS}.csv"
        df.to_csv(final_filename, index=False, encoding="utf-8")
        print(f"[✓] Completed region {region_name}: saved to {final_filename}")
    else:
        print(f"[!] No new data collected for region {region_name}")

with open(SEEN_FILE, "w", encoding="utf-8") as f:
    json.dump(sorted(seen_ids), f)

print(f"[✓] Done. {total_new:,} new listings this run.")
if total_new == 0:
    # ponytail: row-count exit code; real alerting when a scheduler exists
    print("[✗] FATAL: crawl produced 0 new rows — gateway blocked or "
          "everything already seen", file=sys.stderr)
    sys.exit(1)
