from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from flask_restful import Api, Resource
import prediction
import os
from dotenv import load_dotenv
from utils import (
    standardize_province,
    standardize_district,
    standardize_ward,
)

load_dotenv()

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
api = Api(app)

current_env = os.getenv("FLASK_ENV", "production") 
print(current_env)
print(app.config["DEBUG"]) 


class CheckHealth(Resource):
    def get(self):
        return {"status": "ok"}


class PricePrediction(Resource):
    def post(self):
        data = request.get_json()
        data["province"] = standardize_province(data["province"])
        data["district"] = standardize_district(data["district"])
        data["ward"] = standardize_ward(data["ward"])
        print("Data received: ", data)

        prediction_result = prediction.predict_price(data)
        return jsonify(prediction_result)


api.add_resource(CheckHealth, "/prices/health")
api.add_resource(PricePrediction, "/prices/prediction")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(port=port, debug=True)
