import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import SGDRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np
import os

# Get the absolute path to the CSV file
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.join(current_dir, '..', '..')
csv_path = os.path.join(root_dir, 'mogi_after_parsing.csv')

# Load the data
data = pd.read_csv(csv_path)

# Preprocessing
# Define numerical and categorical columns excluding the 'price' column
numerical_cols = data[
    ["area", "bedrooms", "bathrooms", "location_latitude", "location_longitude"]
].columns
categorical_cols = data[
    [
        "title",
        "description",
        "property_type",
        "transaction_type",
        "province",
        "district",
        "ward",
        "street",
        "owner_name",
        "owner_contact",
    ]
].columns

# Preprocessing for numerical data: missing values imputation and scaling
numerical_transformer = Pipeline(
    steps=[("imputer", SimpleImputer(strategy="mean")), ("scaler", StandardScaler())]
)

# Preprocessing for categorical data: missing values imputation and one-hot encoding
categorical_transformer = Pipeline(
    steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ]
)

# Bundle preprocessing for numerical and categorical data
preprocessor = ColumnTransformer(
    transformers=[
        ("num", numerical_transformer, numerical_cols),
        ("cat", categorical_transformer, categorical_cols),
    ]
)

# Define the model with SGDRegressor
# model = SGDRegressor(
#     max_iter=1000,
#     tol=1e-3,
#     penalty="l2",
#     alpha=0.01,
#     learning_rate="adaptive",
#     eta0=0.01,
# )

model = RandomForestRegressor(n_estimators=100, random_state=42)

# Create and evaluate the pipeline
pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("model", model)])

# Split data into train and test sets
X = data.drop("price", axis=1)  # features
y = data["price"]  # target variable
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)

# Training the model
pipeline.fit(X_train, y_train)

# Predicting and evaluating the model
y_preds = pipeline.predict(X_test)
mse = mean_squared_error(y_test, y_preds)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_preds)

print(f"Mean Squared Error: {mse}")
print(f"Root Mean Squared Error: {rmse}")
print(f"R-squared Score: {r2}")
