"""Flask app for the price-prediction service.

Production: gunicorn --bind 127.0.0.1:5000 app:app   (nginx fronts it)
Dev only:   python app.py  (debug server, no reloader, bound to localhost)
"""

import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

import prediction
from utils import standardize_district, standardize_province, standardize_ward

load_dotenv()

app = Flask(__name__)
# No wildcard: comma-separated allowlist from env.
CORS(app, origins=[o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()])


@app.get("/prices/health")
def health():
    return {"status": "ok", "trained_at": prediction.META.get("trained_at")}


@app.post("/prices/prediction")
def price_prediction():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "request body must be a JSON object"}), 400
    for field, standardize in (
        ("province", standardize_province),
        ("district", standardize_district),
        ("ward", standardize_ward),
    ):
        if isinstance(data.get(field), str):
            data[field] = standardize(data[field])
    try:
        return jsonify(prediction.predict_price(data))
    except prediction.ValidationError as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", 5000)))
