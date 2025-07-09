import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import * as chrono from 'chrono-node'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const Dashboard = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2029-05-31' })
  const [predictionDate, setPredictionDate] = useState('')
  const [predictedPrice, setPredictedPrice] = useState(null)
  const [modelMetrics, setModelMetrics] = useState({ rmse: null, mae: null })
  const [selectedDate, setSelectedDate] = useState(null)
const [features, setFeatures] = useState({
  volume: '',
  marketCap: '',
  open: '',
  high: '',
  low: ''
})
  const formatNumber = (num) => {
    if (isNaN(num) || num === null) return '0'
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B'
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M'
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + 'K'
    return num.toFixed(2)
  }

  useEffect(() => {
    fetch('/Bitcoin_1_1_2015-5_31_2025_historical_data_coinmarketcap.csv')
      .then(response => response.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          delimiter: ';',
          transformHeader: header => header.trim().replace(/^"|"$/g, ''),
          transform: (value, header) => {
            const cleaned = value.trim().replace(/^"|"$/g, '')
            return ['open', 'high', 'low', 'close', 'volume', 'marketCap'].includes(header)
              ? parseFloat(cleaned) || 0
              : cleaned
          },
          complete: (results) => {
            const parsedData = results.data
              .map(row => {
                const open = parseFloat(row.open)
                const close = parseFloat(row.close)
                const priceChange = (open && !isNaN(close))
                  ? ((close - open) / open * 100).toFixed(2)
                  : 0
                const parsedDate = chrono.parseDate(row.timeOpen)
                return parsedDate ? {
                  ...row,
                  date: parsedDate,
                  priceChange: parseFloat(priceChange),
                } : null
              })
              .filter(Boolean)

            const withAverages = parsedData.map((row, index, arr) => {
              const slice7 = arr.slice(Math.max(0, index - 6), index + 1)
              const slice30 = arr.slice(Math.max(0, index - 29), index + 1)
              const ma7 = slice7.reduce((sum, r) => sum + r.close, 0) / slice7.length
              const ma30 = slice30.reduce((sum, r) => sum + r.close, 0) / slice30.length
              return { ...row, ma7, ma30 }
            })

            setData(withAverages)
            setLoading(false)
          },
          error: err => {
            console.error('Papa Parse Error:', err)
            setLoading(false)
          }
        })
      })
      .catch(err => {
        console.error('Fetch Error:', err)
        setLoading(false)
      })
  }, [])

  const highestVolatility = data.reduce((max, row) =>
    Math.abs(row.priceChange) > Math.abs(max.priceChange || 0) ? row : max, {})

  const filteredData = data.filter(row =>
    row.date >= new Date(dateRange.start) && row.date <= new Date(dateRange.end))

  const handlePrediction = async () => {
    if (!predictionDate) return alert('Please select a date for prediction')

    const selected = new Date(predictionDate)
    if (selected < new Date('2015-01-01') ) {
      return alert('Prediction date must be between 2015-01-01 and 2025-05-31')
    }

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: predictionDate }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', error)
        throw new Error('Prediction API failed')
      }

      const result = await response.json()
      if (result.error) return alert(result.error)

      setPredictedPrice(result.predictedPrice)
      setModelMetrics({ rmse: result.rmse, mae: result.mae })
      setSelectedDate(result.selectedDate || predictionDate)
    } catch (error) {
      console.error('Prediction Error:', error)
      alert('Failed to fetch prediction.')
    }
  }

  if (loading) {
    return <div className="text-center text-2xl mt-10">Loading Bitcoin Data...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-800">
        Bitcoin Price Insights Dashboard (2024–2025)
      </h1>

      {/* Date Range Selector */}
      <div className="mb-6 flex justify-center gap-4">
        {['start', 'end'].map(key => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700">
              {key === 'start' ? 'Start Date' : 'End Date'}
            </label>
            <input
              type="date"
              value={dateRange[key]}
              onChange={(e) => setDateRange({ ...dateRange, [key]: e.target.value })}
              min="2015-01-01"
              //max="2025-05-31"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        ))}
      </div>

      {/* Reusable Chart Component */}
      {[
        {
          title: 'Closing Price Over Time',
          type: 'line',
          lines: [
            { key: 'close', color: '#3B82F6', name: 'Closing Price' },
            { key: 'ma7', color: '#10B981', name: '7-Day MA' },
            { key: 'ma30', color: '#F59E0B', name: '30-Day MA' }
          ]
        },
        {
          title: 'Trading Volume',
          type: 'bar',
          bars: [{ key: 'volume', color: '#10B981', name: 'Volume' }]
        },
        {
          title: 'Market Cap Trends',
          type: 'area',
          areas: [{ key: 'marketCap', color: '#F59E0B', name: 'Market Cap' }]
        },
        {
          title: 'Daily Price Change (%)',
          type: 'scatter',
          scatters: [{ key: 'priceChange', color: '#EF4444', name: 'Price Change %' }]
        }
      ].map((chart, i) => (
        <div className="mb-8" key={i}>
          <h2 className="text-xl font-semibold text-gray-800">{chart.title}</h2>
          <ResponsiveContainer width="100%" height={400}>
            {chart.type === 'line' && (
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={d => d.toISOString().slice(0, 10)} />
                <YAxis tickFormatter={v => `$${formatNumber(v)}`} fontSize={12} />
                <Tooltip formatter={v => `$${formatNumber(v)}`} labelFormatter={d => d.toISOString().slice(0, 10)} />
                <Legend />
                {chart.lines.map(line => (
                  <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} name={line.name} />
                ))}
              </LineChart>
            )}
            {chart.type === 'bar' && (
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={d => d.toISOString().slice(0, 10)} />
                <YAxis tickFormatter={v => `$${formatNumber(v)}`} />
                <Tooltip formatter={v => `$${formatNumber(v)}`} labelFormatter={d => d.toISOString().slice(0, 10)} />
                <Legend />
                {chart.bars.map(bar => (
                  <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name} />
                ))}
              </BarChart>
            )}
            {chart.type === 'area' && (
              <AreaChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={d => d.toISOString().slice(0, 10)} />
                <YAxis tickFormatter={v => `$${formatNumber(v)}`} />
                <Tooltip formatter={v => `$${formatNumber(v)}`} labelFormatter={d => d.toISOString().slice(0, 10)} />
                <Legend />
                {chart.areas.map(area => (
                  <Area key={area.key} type="monotone" dataKey={area.key} stroke={area.color} fill={area.color} fillOpacity={0.3} name={area.name} />
                ))}
              </AreaChart>
            )}
            {chart.type === 'scatter' && (
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={d => d.toISOString().slice(0, 10)} />
                <YAxis tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${v}%`} labelFormatter={d => d.toISOString().slice(0, 10)} />
                <Legend />
                {chart.scatters.map(scatter => (
                  <Scatter key={scatter.key} data={filteredData} dataKey={scatter.key} fill={scatter.color} name={scatter.name} />
                ))}
              </ScatterChart>
            )}
          </ResponsiveContainer>
        </div>
      ))}

      {/* Interesting Fact */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold text-blue-800">Interesting Fact</h2>
        <p className="text-gray-700">
          The highest volatility day was {highestVolatility.date?.toISOString().slice(0, 10)} with a price change of {highestVolatility.priceChange}%.
        </p>
      </div>

      {/* Prediction Form */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800">Predict Bitcoin Price</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="date"
            value={predictionDate}
            onChange={(e) => setPredictionDate(e.target.value)}
            min="2015-01-01"
           // max="2025-05-31"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          <button
            onClick={handlePrediction}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Predict
          </button>
        </div>
        {predictedPrice !== null && (
          <p className="text-gray-700">
            Predicted Bitcoin Price for <strong>{selectedDate}</strong>: <strong>${formatNumber(predictedPrice)}</strong>
          </p>
        )}
        <p className="text-gray-600 text-sm mt-2">
          Model Metrics — RMSE: {modelMetrics.rmse || 'N/A'}, MAE: {modelMetrics.mae || 'N/A'}
        </p>
      </div>
    </div>
  )
}

export default Dashboard
