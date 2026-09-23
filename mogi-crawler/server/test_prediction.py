"""Contract test for the price-prediction service. No framework — run:

    crawlers-venv/bin/python mogi-crawler/server/test_prediction.py
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)  # prediction, app, utils
sys.path.insert(0, ROOT)  # website_scraper package

import prediction  # noqa: E402  (import loads the artifacts once)
from website_scraper.pipelines import parse_price  # noqa: E402

# (a) saved artifacts load and match the meta contract
assert prediction.MODEL is not None
assert prediction.META["features"] == prediction.FEATURES
for enc in ("le_province", "le_district", "le_ward"):
    assert len(prediction.ENCODERS[enc].classes_) > 0

sample = {
    "province": str(prediction.ENCODERS["le_province"].classes_[0]),
    "district": str(prediction.ENCODERS["le_district"].classes_[0]),
    "ward": str(prediction.ENCODERS["le_ward"].classes_[0]),
    "location_latitude": 10.75,
    "location_longitude": 106.65,
    "area": 50,
    "bedrooms": 2,
    "bathrooms": 1,
}

# (b) a valid sample predicts a sane positive price (triệu VND)
result = prediction.predict_price(dict(sample))
assert 0.1 <= result["price"] <= 1000, result

# (c) swapped coords (lat > 50) rejected with 400 — via the HTTP surface
import app as serving  # noqa: E402

client = serving.app.test_client()
r = client.post("/prices/prediction", json={**sample, "location_latitude": 106.65, "location_longitude": 10.75})
assert r.status_code == 400, (r.status_code, r.get_json())
# unseen district also 400, never a LabelEncoder 500
r = client.post("/prices/prediction", json={**sample, "district": "Không Tồn Tại"})
assert r.status_code == 400, (r.status_code, r.get_json())
# and the valid sample goes through HTTP too
r = client.post("/prices/prediction", json=sample)
assert r.status_code == 200 and r.get_json()["price"] > 0, (r.status_code, r.get_json())

# (d) parse_price: number+unit required, no silent zeros
assert parse_price("1.5 tỷ") == 1500.0
assert parse_price("17 triệu/tháng") == 17.0
assert parse_price("500 nghìn") == 0.5
assert parse_price("Liên hệ") is None
assert parse_price("") is None
assert parse_price("thỏa thuận triệu") is None  # unit without a number

print("OK — all prediction-service contract tests passed")
