#!/usr/bin/env python3
"""
Robust importer for crawled rental listings from Nha Tot and Mogi into MySQL rental_posts.
Uses standard Python csv module to handle multiline / quoted text properly.
"""
import os
import sys
import csv
import json
import math
import pymysql

DB_HOST = os.getenv("DB_HOST_WRITE", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3307"))
DB_USER = os.getenv("DB_USER", "rentalk")
DB_PASS = os.getenv("DB_PASSWORD", "rentalk_local_only")
DB_NAME = os.getenv("DB_NAME", "rentalk_local")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CRAWL_FILES = [
    os.path.join(ROOT_DIR, "nhatot-crawler", "data", "nhatot_rentals_100k.csv"),
    os.path.join(ROOT_DIR, "nhatot-crawler", "data", "nhatot_100k_combined.csv"),
    os.path.join(ROOT_DIR, "nhatot-crawler", "data", "data_HCM_p200.csv"),
    os.path.join(ROOT_DIR, "mogi-crawler", "mogi_after_parsing.csv"),
]

def parse_price_million(raw):
    try:
        val = float(raw)
        if val <= 0:
            return None
        # Cho Tot: prices in VND (e.g. 5,000,000)
        if val > 1000:
            val = val / 1_000_000
        # Sanity check: between 0.5m and 500m
        if 0.5 <= val <= 500:
            return round(val, 2)
    except Exception:
        pass
    return None

def main():
    if DB_NAME != "rentalk_local" or os.getenv("NODE_ENV") == "production":
        raise RuntimeError("Legacy importer is local-only; production needs a validated, authorized feed.")
    max_to_import = int(sys.argv[1]) if len(sys.argv) > 1 else 300
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        charset="utf8mb4",
        autocommit=False,
    )
    cursor = conn.cursor()
    print(f"[*] Connected to MySQL database '{DB_NAME}' on port {DB_PORT}")

    total_inserted = 0
    total_skipped = 0

    for file_path in CRAWL_FILES:
        if not os.path.exists(file_path):
            continue
        print(f"[*] Reading listings from {os.path.basename(file_path)}...")

        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                lid = row.get("list_id") or row.get("ad_id")
                if not lid:
                    continue

                source_url = row.get("source_url") or f"https://www.nhatot.com/{lid}.htm"
                source_url = source_url[:255]

                # Check if already exists
                cursor.execute("SELECT id FROM rental_posts WHERE source_url = %s", (source_url,))
                if cursor.fetchone():
                    total_skipped += 1
                    continue

                raw_price = row.get("price")
                price = parse_price_million(raw_price)
                if not price:
                    continue

                title = (row.get("subject") or row.get("title") or "Cho thuê phòng trọ").strip()[:100]
                body = (row.get("body") or row.get("description") or title).strip()[:2000]

                try:
                    area = float(row.get("size") or row.get("area") or 30.0)
                    if area <= 0 or area > 10000:
                        area = 30.0
                except Exception:
                    area = 30.0

                try:
                    rooms = int(row.get("rooms") or row.get("bedrooms") or 1)
                except Exception:
                    rooms = 1

                try:
                    toilets = int(row.get("toilets") or row.get("bathrooms") or 1)
                except Exception:
                    toilets = 1

                try:
                    lat = float(row.get("latitude"))
                    lng = float(row.get("longitude"))
                    if not math.isfinite(lat) or not math.isfinite(lng) or not -85 <= lat <= 85 or not -180 <= lng <= 180 or (lat == 0 and lng == 0):
                        raise ValueError("Invalid coordinates")
                except Exception:
                    lat, lng = None, None

                prov = (row.get("region_name") or row.get("province") or "TP Hồ Chí Minh")[:100]
                dist = (row.get("area_name") or row.get("district") or "Quận 1")[:100]
                ward = (row.get("ward_name") or row.get("ward") or "")[:100]
                addr = f"{ward}, {dist}, {prov}" if ward else f"{dist}, {prov}"
                addr = addr[:255]

                p_type = "room"
                t_lower = title.lower()
                cat = str(row.get("category") or "")
                if cat == "1010" or "căn hộ" in t_lower or "chung cư" in t_lower or "apartment" in t_lower:
                    p_type = "apartment"
                elif cat == "1030" or "nhà nguyên căn" in t_lower or "nhà phố" in t_lower or "biệt thự" in t_lower:
                    p_type = "house"

                contact = (row.get("account_name") or row.get("owner_name") or "Chính chủ")[:100]

                cursor.execute(
                    """INSERT INTO rental_posts 
                    (name, description, price, area, property_type, transaction_type, province, district, ward, latitude, longitude, displayed_address, status, bedrooms, bathrooms, source_url, contact_name, created_at, updated_at) 
                    VALUES (%s, %s, %s, %s, %s, 'rent', %s, %s, %s, %s, %s, %s, 'active', %s, %s, %s, %s, NOW(), NOW())""",
                    (title, body, price, area, p_type, prov, dist, ward, lat, lng, addr, rooms, toilets, source_url, contact)
                )
                post_id = cursor.lastrowid

                img = row.get("image") or row.get("thumbnail")
                if img and img.startswith("http"):
                    cursor.execute(
                        "INSERT INTO rental_images (rental_id, url, created_at, updated_at) VALUES (%s, %s, NOW(), NOW())",
                        (post_id, img[:255])
                    )

                total_inserted += 1
                if total_inserted % 50 == 0:
                    conn.commit()
                    print(f"  -> Imported {total_inserted} active listings into MySQL...")

                if total_inserted >= max_to_import:
                    break

        if total_inserted >= max_to_import:
            break

    conn.commit()
    cursor.close()
    conn.close()
    print(f"\n[✓] Finished importing! Added {total_inserted} active listings. Skipped {total_skipped} existing.")

if __name__ == "__main__":
    main()
