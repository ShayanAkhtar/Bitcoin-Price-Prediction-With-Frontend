# Bitcoin Price Dashboard

A web application for visualizing Bitcoin price trends from January 1, 2015, to May 31, 2025, and predicting future prices using a Random Forest model. The dashboard provides interactive charts for closing prices, trading volume, market cap, and daily price changes, along with a prediction feature for Bitcoin prices on specific dates.

## Features

- **Interactive Charts**:
  - Closing Price Over Time (with 7-day and 30-day moving averages)
  - Trading Volume
  - Market Cap Trends
  - Daily Price Change (%)
- **Price Prediction**:
  - Predict Bitcoin prices using a trained Random Forest model.
  - Displays model metrics (RMSE: 343.25, MAE: 221.14).
- **Date Range Filtering**: Select custom date ranges to focus on specific periods.
- **Interesting Fact**: Highlights the highest volatility day in 2025.
- **Responsive Design**: Built with Tailwind CSS for a modern, mobile-friendly UI.

## Tech Stack

- **Frontend**:
  - React (Vite)
  - Recharts for data visualization
  - PapaParse for CSV parsing
  - Tailwind CSS for styling
  - Chrono-node for date parsing
- **Backend**:
  - Flask (Python)
  - Pandas for data processing
  - Scikit-learn (Random Forest Regressor)
  - Joblib for model serialization
  - Flask-CORS for cross-origin requests
- **Data**:
  - Semicolon-separated CSV (`Bitcoin_1_1_2015-5_31_2025_historical_data_coinmarketcap.csv`)
- **Development Tools**:
  - Node.js (v16 or higher)
  - Python (3.8 or higher)
  - Vite for frontend build
  - Virtualenv for Python dependencies

## Prerequisites

- Node.js (v16 or higher): Download
- Python (3.8 or higher): Download
- Git: Download

## Setup Instructions

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/your-username/bitcoin-price-dashboard.git
   cd bitcoin-price-dashboard
   ```

2. **Set Up the Backend**:

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install flask flask-cors pandas scikit-learn joblib numpy
   ```

   - Ensure `Bitcoin_1_1_2015-5_31_2025_historical_data_coinmarketcap.csv` is in the `backend/` directory.
   - Train the model:

     ```bash
     python train_model.py
     ```

3. **Set Up the Frontend**:

   ```bash
   cd ../
   npm install
   ```

   - Ensure `Bitcoin_1_1_2015-5_31_2025_historical_data_coinmarketcap.csv` is in the `public/` directory.

4. **Run the Application**:

   - Start the backend:

     ```bash
     cd backend
     source venv/bin/activate  # On Windows: venv\Scripts\activate
     python app.py
     ```
     - The Flask server runs on `http://localhost:5000`.
   - Start the frontend:

     ```bash
     cd ../
     npm run dev
     ```
     - The React app runs on `http://localhost:5173`.

5. **Access the Dashboard**:

   - Open `http://localhost:5173` in your browser.

## Usage

1. **View Charts**:
   - Use the date range selector to filter data (default: 2024-01-01 to 2025-05-31).
   - Explore Closing Price, Trading Volume, Market Cap, and Daily Price Change charts.
2. **Predict Prices**:
   - Select a date between 2015-01-01 and 2025-05-31 in the prediction form.
   - Click "Predict" to view the predicted Bitcoin price and model metrics.
3. **Interesting Fact**:
   - Check the highest volatility day in 2025 at the bottom of the dashboard.