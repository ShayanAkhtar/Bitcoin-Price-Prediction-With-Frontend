import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
import joblib

# Load and preprocess data
def preprocess_data(csv_path):
    df = pd.read_csv(csv_path, sep=';')  # Use semicolon separator
    df['timeOpen'] = pd.to_datetime(df['timeOpen'], utc=True)  # Ensure UTC timezone
    
    # Feature engineering
    df['price_change'] = (df['close'] - df['open']) / df['open'] * 100
    df['ma7'] = df['close'].rolling(window=7).mean()
    df['ma30'] = df['close'].rolling(window=30).mean()
    df['volatility'] = df['close'].rolling(window=7).std()
    
    # Drop rows with NaN values (due to rolling calculations)
    df = df.dropna()
    
    # Features and target
    features = ['open', 'high', 'low', 'volume', 'marketCap', 'price_change', 'ma7', 'ma30', 'volatility']
    X = df[features]
    y = df['close']
    
    return X, y, df

# Train model
def train_model():
    csv_path = 'Bitcoin_1_1_2015-5_31_2025_historical_data_coinmarketcap.csv'
    X, y, df = preprocess_data(csv_path)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    print(f"Model Metrics - RMSE: {rmse:.2f}, MAE: {mae:.2f}")
    
    # Save model
    joblib.dump(model, 'bitcoin_price_model.pkl')
    
    return model, df

if __name__ == "__main__":
    model, df = train_model()