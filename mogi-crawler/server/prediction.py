import pickle
import pandas as pd
from sklearn.preprocessing import LabelEncoder


def predict_price(data):
    model = pickle.load(open("../website_scraper/models/re_model.pkl", "rb"))
    encoders = pickle.load(open("../website_scraper/models/label_encoder.pkl", "rb"))

    if type(data) == dict:
        data = pd.DataFrame(data, index=[0])
        data["district"] = encoders["le_district"].transform(data["district"])
        data["province"] = encoders["le_province"].transform(data["province"])
        data["ward"] = encoders["le_ward"].transform(data["ward"])

    data = data[
        [
            "province",
            "district",
            "ward",
            "location_latitude",
            "location_longitude",
            "area",
        ]
    ]
    prediction = model.predict(data)
    return {"price": prediction[0]}
