// pages/api/summary.js
import { supabaseServer } from "../../lib/supabase";
import { GoogleGenerativeAI } from "@google/genai";
//import { searchFlights } from "../../adapters/flights/aviationStackAdapter";
import { searchFlights } from "../../adapters/flights/flightScraperSkyAdapter";
import { getFlightPrices } from "../../adapters/flights/flightScraperSkyAdapter";
import { getTrainAvailability } from "../../adapters/trains/trainScraper";

const ai = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  try {
    const { type, from, to } = req.query;
    if (!type || !from || !to) {
      return res.status(400).json({ error: "type, from, to required" });
    }

    // 1️⃣ Fetch historical fares (last 60 days)
    const { data: historyRows, error: historyError } = await supabaseServer
      .from("fare_history")
      .select("snapshot_date, price, from_code, to_code")
      .eq("type", type)
      .eq("from_code", from)
      .eq("to_code", to)
      .order("snapshot_date", { ascending: true })
      .limit(1000);

    if (historyError) throw historyError;

    const history = (historyRows || [])
      .map(r => ({ date: r.snapshot_date, price: Number(r.price) }))
      .filter(h => !isNaN(h.price));

    // 2️⃣ Stats for route
    let minFare = null, maxFare = null, avgFare = null, volatility = null, bestDay = null;
    if (history.length > 0) {
      const prices = history.map(h => h.price);
      minFare = Math.min(...prices);
      maxFare = Math.max(...prices);
      avgFare = prices.reduce((a,b)=>a+b,0)/prices.length;
      const variance = prices.reduce((sum,p)=> sum + Math.pow(p - avgFare,2), 0)/prices.length;
      volatility = Math.sqrt(variance);
      bestDay = history.find(h => h.price === minFare)?.date;
    }

    // 3️⃣ Current availability
    let currentAvailability = [];
    const today = new Date().toISOString().split("T")[0];

    if (type === "flight") {
      const flights = await searchFlights({ origin: from, destination: to, date: today });
    //  const prices = await getFlightPrices({ origin: from, destination: to, date: today });
      currentAvailability = flights.map(f => ({
          flightNumber: f.flightNumber || null,
          airline: f.airline || null,
          departure: f.departure || null,
          arrival: f.arrival || null,
          duration: f.duration || null,
          stops: f.stops || 0,
          cabin: f.cabin || null,
          price: f.price || null,
          currency: f.currency || "INR"
        }));

    } else {
      const currentAvailability = await getTrainAvailability({ from, to, date: today });

      // ensure price is null if missing
      currentAvailability.forEach(s => {
        if (s.price === undefined) s.price = null;
      });
    }

    // 4️⃣ Top destinations (last 60 days)
    const { data: recentRows } = await supabaseServer
      .from("fare_history")
      .select("to_code")
      .gte("snapshot_date", new Date(Date.now() - 1000*60*60*24*60).toISOString().split("T")[0])
      .limit(10000);

    const destCounts = {};
    (recentRows || []).forEach(r => {
      if (!r.to_code) return;
      destCounts[r.to_code] = (destCounts[r.to_code] || 0) + 1;
    });
    const topDestinations = Object.entries(destCounts)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,5)
      .map(([code,count]) => ({ code, count }));

    // 5️⃣ Build prompt for Gemini
    const promptParts = [
      "You are a travel insights assistant. Provide a concise, actionable summary and bullet points.",
      `Route: ${from} → ${to} (${type})`,
    ];

    if (history.length > 0) {
      promptParts.push(`Historical fares: min ₹${minFare}, max ₹${maxFare}, avg ₹${Math.round(avgFare)}, volatility ₹${Math.round(volatility)}, cheapest day ${bestDay}.`);
    } else {
      promptParts.push("No historical fare snapshots available.");
    }

    if (currentAvailability.length === 0) promptParts.push("No current availability data found.");
    else currentAvailability.slice(0,6).forEach(a => {
      if (type === "flight") promptParts.push(`- Flight: cabin ${a.cabin}, price: ${a.price ?? "N/A"}`);
      else promptParts.push(`- Train ${a.trainNo} class ${a.class}, seats: ${a.availableSeats ?? "N/A"}, price: ${a.price ?? "N/A"}`);
    });

    promptParts.push(`Top destinations right now: ${topDestinations.map(d=>`${d.code}(${d.count})`).join(", ") || "N/A"}`);
    promptParts.push(`Tasks:
1) Give a short summary (2-4 sentences) of fare trends and whether to book now or wait.
2) Identify which flights/trains are cheapest right now and recommend the best price to look for.
3) Recommend top 3 actions for the traveler (e.g., best day to book, class to choose, alternate dates).
4) Give a short note about top destinations currently popular.`);

    const prompt = promptParts.join("\n");

    // 6️⃣ Call Gemini AI
    const genResp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });

    const analysisText =
      genResp?.candidates?.[0]?.content?.parts?.[0]?.text ||
      genResp?.text ||
      "No insights available";

    // 7️⃣ Return response
    res.status(200).json({
      route: `${from} → ${to}`,
      type,
      analysis: analysisText,
      historyCount: history.length,
      currentAvailability,
      topDestinations
    });

  } catch (err) {
    console.error("Summary API error:", err);
    res.status(500).json({ error: err.message });
  }
}
