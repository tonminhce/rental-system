import csv
import os
import re
from datetime import datetime

import requests
from itemadapter import ItemAdapter

from .utils import standardize_district, standardize_ward

# number + unit, both required. The old regex was all-optional so it matched
# the empty string and "1.5 tỷ" silently became 0, poisoning labels.
_PRICE_RE = re.compile(
    r"(\d+(?:[.,]\d+)?)\s*(tỷ|tỉ|triệu|nghìn|ngàn)", re.IGNORECASE
)
_PRICE_MULT = {"tỷ": 1e3, "tỉ": 1e3, "triệu": 1.0, "nghìn": 1e-3, "ngàn": 1e-3}


def parse_price(price_str):
    """Price in triệu (millions of VND), or None when not parseable."""
    if not price_str:
        return None
    x = _PRICE_RE.search(str(price_str))
    if x is None:
        return None
    return float(x.group(1).replace(",", ".")) * _PRICE_MULT[x.group(2).lower()]


class MogiPipeline:
    def __init__(self):
        # In here we will authenticate to the main rental service
        # Login to the rental service
        self.api_url = os.getenv("RENTAL_API_URL", "http://localhost:8100/api")
        self.access_token = None
        self.skipped_price = 0
        api_email = os.getenv("RENTAL_API_EMAIL")
        api_password = os.getenv("RENTAL_API_PASSWORD")
        if not api_email or not api_password:
            # process_item already skips the authenticated POST when no token
            # was issued, so crawling continues and only reports the gap.
            print(
                "Warning: RENTAL_API_EMAIL/RENTAL_API_PASSWORD are unset; "
                "MogiPipeline will not authenticate with the rental service"
            )
            return
        try:
            res = requests.post(
                f"{self.api_url}/auth/login",
                json={"email": api_email, "password": api_password},
                timeout=10,
            )
            if res.status_code == 200:
                self.access_token = res.json()["data"]["token"]
                print("[✓] MogiPipeline authenticated with rental service")
            else:
                print("Warning: Failed to login to rental service:", res.status_code, res.text)
        except Exception as e:
            print("Warning: rental service connection failed in MogiPipeline:", e)

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)

        # Extract address components
        address_data = self.parse_address(adapter["address"])
        price = parse_price(adapter["price"])
        if price is None:
            # Never POST a fabricated 0-price listing.
            self.skipped_price += 1
            spider.logger.warning(
                "Unparseable price %r — skipping API post for %s",
                adapter["price"], adapter["post_url"],
            )
            return item

        if self.access_token:
            try:
                res = requests.post(
                    f"{self.api_url}/posts",
                    headers={"Authorization": f"Bearer {self.access_token}"},
                    json={
                        "name": adapter["title"],
                        "description": adapter["description"],
                        "propertyType": "room",
                        "transactionType": "rent",
                        "price": float(price),
                        "province": address_data["province"],
                        "district": address_data["district"],
                        "ward": address_data["ward"],
                        "street": address_data["street"],
                        "displayedAddress": adapter["address"],
                        "latitude": float(adapter["coordinates"][0]),
                        "longitude": float(adapter["coordinates"][1]),
                        "images": adapter["images"],
                        "source": "crawler",
                        "sourceUrl": "mogi.vn",
                        "area": self.parse_area(adapter["area"]),
                        "bedrooms": adapter["bedrooms"],
                        "bathrooms": adapter["bathrooms"],
                        "contactName": adapter["owner_name"],
                        "contactPhone": self.parse_phone_number(adapter["owner_contact"]),
                        "postUrl": adapter["post_url"],
                    },
                    timeout=10,
                )
                if res.status_code != 201:
                    print("Warning: failed to store post:", res.status_code, res.text[:200])
            except Exception as e:
                print("Warning: error storing post to rental service:", e)

        return item

    def close_spider(self, spider):
        if self.skipped_price:
            spider.logger.warning("MogiPipeline skipped %d items with unparseable price", self.skipped_price)

    def parse_phone_number(self, owner_contact):
        contact_regex = r"PhoneFormat\('(\d+)'\)"
        x = re.search(contact_regex, owner_contact or "")

        if x is not None:
            return x.group(1)

        return None

    def parse_address(self, address):
        address_details = address.strip().split(", ")

        district_pattern = r"(Quận (2|9|Thủ Đức))( \(TP\.? Thủ Đức\))?"
        province = address_details[-1]
        district = address_details[-2]

        if re.match(district_pattern, address_details[-2]):
            province = "TP. Thủ Đức"
            district = re.search(district_pattern, address_details[-2]).group(1)

        district = standardize_district(district)
        ward = standardize_ward(address_details[-3])

        return {
            "province": province,
            "district": district,
            "ward": ward,
            "street": address_details[-4],
        }

    def parse_area(self, area):
        area_regex = r"(\d+) m"
        x = re.search(area_regex, area or "")

        if x is not None:
            return int(x.group(1))

        return None


class CSVExportPipeline(MogiPipeline):
    def __init__(self):
        # Deliberately NOT calling super().__init__: CSV export needs no API
        # login; it only reuses the parse_* helpers.
        self.skipped_price = 0
        # Timestamped output — never overwrite a previous run's training CSV.
        self.rows = 0
        filename = f"mogi_after_parsing_{datetime.now():%Y%m%d_%H%M%S}.csv"
        self.file = open(filename, "w", newline="", encoding="utf-8")
        self.keys = [
            "title",
            "description",
            "property_type",
            "transaction_type",
            "price",
            "province",
            "district",
            "ward",
            "street",
            "location_latitude",
            "location_longitude",
            "owner_name",
            "owner_contact",
            "area",
            "bedrooms",
            "bathrooms",
        ]
        self.dict_writer = csv.DictWriter(self.file, fieldnames=self.keys)
        self.dict_writer.writeheader()
        print(f"CSVExportPipeline writing to {filename}")

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)

        price = parse_price(adapter["price"])
        if price is None:
            # A silently-zeroed price corrupts the training labels.
            self.skipped_price += 1
            spider.logger.warning(
                "Unparseable price %r — skipping CSV row for %s",
                adapter["price"], adapter["post_url"],
            )
            return item

        address_data = self.parse_address(adapter["address"])
        json_data = {
            "title": adapter["title"],
            "description": adapter["description"],
            "property_type": "room",
            "transaction_type": "rent",
            "price": price,
            "province": address_data["province"],
            "district": address_data["district"],
            "ward": address_data["ward"],
            "street": address_data["street"],
            "location_latitude": float(adapter["coordinates"][0]),
            "location_longitude": float(adapter["coordinates"][1]),
            "owner_name": adapter["owner_name"],
            "owner_contact": self.parse_phone_number(adapter["owner_contact"]),
            "area": self.parse_area(adapter["area"]),
            "bedrooms": adapter["bedrooms"],
            "bathrooms": adapter["bathrooms"],
        }

        self.dict_writer.writerow(json_data)
        self.rows += 1
        return item

    def close_spider(self, spider):
        self.file.close()
        spider.logger.info("CSVExportPipeline wrote %d rows, skipped %d (bad price)", self.rows, self.skipped_price)
