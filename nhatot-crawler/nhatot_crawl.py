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


# Function to fetch a single page of data
def get_data(region_code, page):
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

    try:
        response = requests.get(BASE_URL, params=params, headers=headers, timeout=10)
        if response.status_code == 200:
            json_data = response.json()
            ads = json_data.get("ads", [])
            print(f"[✓] Page {page} fetched with {len(ads)} ads.")
            return ads
        else:
            print(f"[!] HTTP Error {response.status_code} on page {page}")
            return []
    except RequestException as e:
        print(f"[!] Network error on page {page}: {e}")
        return []


# === Start crawling ===
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
            if ads:
                all_data.extend(ads)

            # Save checkpoint every N pages
            if count % SAVE_INTERVAL == 0:
                df = pd.DataFrame(all_data)
                temp_filename = f"data/data_{region_name}_p{count}.csv"
                df.to_csv(temp_filename, index=False, encoding="utf-8")
                print(f"[✓] Saved checkpoint: {temp_filename}")

    # Save final CSV after region is fully crawled
    if all_data:
        df = pd.DataFrame(all_data)
        final_filename = f"phongtro_{region_name}_full.csv"
        df.to_csv(final_filename, index=False, encoding="utf-8")
        print(f"[✓] Completed region {region_name}: saved to {final_filename}")
    else:
        print(f"[!] No data collected for region {region_name}")
