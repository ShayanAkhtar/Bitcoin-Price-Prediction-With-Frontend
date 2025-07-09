from flask import Flask, request, jsonify
import pandas as pd
import joblib
import numpy as np
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load model and data
model = joblib.load('bitcoin_price_model.pkl')
df = pd.read_csv('Bitcoin_1_1_2015-5_31_2025_historical_data_coinmarketcap.csv', sep=';')  # Use semicolon separator
df['timeOpen'] = pd.to_datetime(df['timeOpen'], utc=True)  # Ensure UTC timezone
df = df.sort_values('timeOpen').reset_index(drop=True)  # Sort by timeOpen

# Get the latest date in the dataset
latest_date = df['timeOpen'].max()

# Define feature names (must match those used in train_model.py)
feature_names = ['open', 'high', 'low', 'volume', 'marketCap', 'price_change', 'ma7', 'ma30', 'volatility']

# Preprocess input for prediction
def prepare_input(date_str):
    try:
        logger.debug(f"Processing date: {date_str}")
        date = pd.to_datetime(date_str, utc=True)

        # Step 1: Use data up to the target date, even if it's not in dataset
        recent_data = df[df['timeOpen'] <= date]
        if recent_data.empty:
            # If no data exists before the target date, fail gracefully
            logger.warning(f"No data available before {date_str}, cannot compute features.")
            return None, None, f"No historical data available before {date_str} to compute features."

        recent_row = recent_data.iloc[-1]
        selected_date = recent_row['timeOpen'].strftime('%Y-%m-%d')
        logger.debug(f"Using closest available data point on or before: {selected_date}")

        # Step 2: Collect the 30 most recent days for moving averages & volatility
        recent_df = df[df['timeOpen'] <= recent_row['timeOpen']].tail(30)
        if recent_df.shape[0] < 7:
            logger.warning("Not enough data points to compute all rolling features.")
            return None, None, "Insufficient historical data (minimum 7 days required) for rolling feature calculation."

        # Step 3: Compute all features
        price_change = (recent_row['close'] - recent_row['open']) / recent_row['open'] * 100
        ma7 = recent_df['close'].rolling(window=7).mean().iloc[-1]
        ma30 = recent_df['close'].rolling(window=30).mean().iloc[-1] if recent_df.shape[0] >= 30 else recent_df['close'].mean()
        volatility = recent_df['close'].rolling(window=7).std().iloc[-1]

        # Step 4: Handle possible NaNs
        if any(np.isnan([ma7, ma30, volatility])):
            logger.warning("NaN encountered in rolling calculations, replacing with fallback values.")
            ma7 = ma7 if not np.isnan(ma7) else recent_df['close'].mean()
            ma30 = ma30 if not np.isnan(ma30) else recent_df['close'].mean()
            volatility = volatility if not np.isnan(volatility) else recent_df['close'].std()

        # Step 5: Assemble feature vector
        features = {
            'open': recent_row['open'],
            'high': recent_row['high'],
            'low': recent_row['low'],
            'volume': recent_row['volume'],
            'marketCap': recent_row['marketCap'],
            'price_change': price_change,
            'ma7': ma7,
            'ma30': ma30,
            'volatility': volatility,
        }

        # Convert to DataFrame using specified feature order
        features_df = pd.DataFrame([features], columns=feature_names)
        logger.debug(f"Prepared features from closest available date: {features_df.to_dict(orient='records')[0]}")

        return features_df, selected_date, None

    except Exception as e:
        logger.error(f"Error in prepare_input: {str(e)}")
        return None, None, str(e)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        logger.debug(f"Received request: {data}")

        date_str = data.get('date')
        if not date_str:
            logger.error("No date provided in request")
            return jsonify({'error': 'Date is required'}), 400

        features, selected_date, error = prepare_input(date_str)
        if features is None:
            logger.error(f"Input preparation failed: {error}")
            return jsonify({'error': error}), 400

        prediction = model.predict(features)[0]
        logger.debug(f"Prediction: {prediction}")
        return jsonify({
            'predictedPrice': round(prediction, 2),
            'selectedDate': selected_date,  # Return the actual date used
            'rmse': 343.25,  # Actual value from train_model.py
            'mae':  221.14    # Actual value from train_model.py
        })
    except Exception as e:
        logger.error(f"Error in predict endpoint: {str(e)}")
        return jsonify({'error': f"Prediction failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)