import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Home() {
  const [type, setType] = useState("flight");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);

  const searchAvailability = async () => {
    if (!from || !to || !date) return alert("Fill all fields");
    setLoading(true);
    const res = await fetch(`/api/availability?type=${type}&from=${from}&to=${to}&date=${date}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);

    // Example: simulate trend data for charts
    if (type === "flight") {
      const trend = data.flights?.map((f, i) => ({ name: f.airline || `Flight ${i+1}`, price: f.price || 0 })) || [];
      setTrendData(trend);

      // Popular destinations (dummy example)
      const popular = data.flights?.slice(0, 5).map(f => f.destination || "Unknown") || [];
      setPopularDestinations(popular);
    }
    if (type === "train") {
      const trend = data.availability?.map((t, i) => ({ name: t.class || `Class ${i+1}`, price: t.price || 0 })) || [];
      setTrendData(trend);
      const popular = data.availability?.slice(0, 5).map(t => t.train_name || "Unknown") || [];
      setPopularDestinations(popular);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white font-sans">
      <header className="p-6 text-center">
        <h1 className="text-4xl font-bold text-indigo-700">Travel AI Agent</h1>
        <p className="mt-2 text-indigo-500">Check flight & train availability, fares, trends & popular destinations</p>
      </header>

      <main className="max-w-5xl mx-auto p-6 bg-white shadow-xl rounded-xl mt-8">
        <div className="flex gap-4 mb-4">
          <button
            className={`flex-1 py-2 rounded ${type === "flight" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
            onClick={() => setType("flight")}
          >
            Flight
          </button>
          <button
            className={`flex-1 py-2 rounded ${type === "train" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
            onClick={() => setType("train")}
          >
            Train
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <input type="text" placeholder="From" value={from} onChange={e => setFrom(e.target.value.toUpperCase())} className="border p-2 rounded w-full"/>
          <input type="text" placeholder="To" value={to} onChange={e => setTo(e.target.value.toUpperCase())} className="border p-2 rounded w-full"/>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border p-2 rounded w-full"/>
        </div>

        <button onClick={searchAvailability} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded mb-4 transition">
          {loading ? "Searching..." : "Search"}
        </button>

        {trendData.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Fare Trends</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#4f46e5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {popularDestinations.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Popular Destinations</h2>
            <div className="flex flex-wrap gap-2">
              {popularDestinations.map((dest, i) => (
                <span key={i} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">{dest}</span>
              ))}
            </div>
          </div>
        )}

        {results && (
          <div className="overflow-x-auto mt-4">
            <pre className="bg-gray-100 p-4 rounded text-sm">{JSON.stringify(results, null, 2)}</pre>
          </div>
        )}
      </main>

      <footer className="text-center p-6 text-gray-500 mt-8">
        &copy; 2025 Travel AI Agent. All rights reserved.
      </footer>
    </div>
  );
}
