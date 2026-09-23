"""Model loading + validated prediction. Artifacts live in server/models/
(re_model.pkl, label_encoder.pkl, model_meta.json) and are produced by
train.py. Loaded ONCE at import — never per request."""

import json
import os
import pickle

import pandas as pd

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

with open(os.path.join(MODELS_DIR, "re_model.pkl"), "rb") as f:
    MODEL = pickle.load(f)
with open(os.path.join(MODELS_DIR, "label_encoder.pkl"), "rb") as f:
    ENCODERS = pickle.load(f)
with open(os.path.join(MODELS_DIR, "model_meta.json"), encoding="utf-8") as f:
    META = json.load(f)

FEATURES = META["features"]
VN_LAT = (8.0, 24.0)  # mainland VN spans ~8.2–23.4; catches lat/lon swaps
VN_LON = (102.0, 110.0)
_ENCODER_FIELDS = {"province": "le_province", "district": "le_district", "ward": "le_ward"}
_NUMERIC_FIELDS = {
    "location_latitude": VN_LAT,
    "location_longitude": VN_LON,
    "area": (0.0, 2000.0),
    "bedrooms": (0.0, 100.0),
    "bathrooms": (0.0, 100.0),
}


class ValidationError(ValueError):
    """Bad request — the app turns this into a 400, never a 500."""


def predict_price(data: dict) -> dict:
    if not isinstance(data, dict):
        raise ValidationError("request body must be a JSON object")

    missing = [f for f in FEATURES if data.get(f) is None or data.get(f) == ""]
    if missing:
        raise ValidationError(f"missing required fields: {', '.join(missing)}")

    row = {}
    for field, bounds in _NUMERIC_FIELDS.items():
        try:
            value = float(data[field])
        except (TypeError, ValueError):
            raise ValidationError(f"{field} must be numeric, got {data[field]!r}")
        lo, hi = bounds
        if not lo <= value <= hi:
            raise ValidationError(f"{field}={value} out of range [{lo}, {hi}]")
        row[field] = value

    for field, encoder_key in _ENCODER_FIELDS.items():
        value = str(data[field]).strip()
        known = ENCODERS[encoder_key].classes_
        if value not in known:
            raise ValidationError(
                f"unknown {field} {value!r} — model was trained on "
                f"{len(known)} known values; retrain after new crawls"
            )
        row[field] = int(ENCODERS[encoder_key].transform([value])[0])

    price = float(MODEL.predict(pd.DataFrame([row])[FEATURES])[0])
    return {"price": round(price, 2)}
