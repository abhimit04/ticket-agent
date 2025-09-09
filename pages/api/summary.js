// pages/api/summary.js
import { supabase } from "../../lib/supabase";
import { GoogleGenAI } from "@google/genai";
import { getTrainAvailability } from "../../adapters/trains/indianRailAdapter";
import { searchFlights, priceFlight } from "../../adapters/flights/amadeusAdapter";
import { getTrainPrices } from "../../adapters/trains/trainPricingCrawler";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  try {
    const { type, from, to } = req.query;
    if (!type || !from || !to) {
      return res.status(400).json({ error: "type, from, to required" });
    }

    // 1) Fetch historical fares (last 60 days)
    const { data: historyRows, error: historyError } = await supabase
      .from("fare_history")
      .select("snapshot_date, price, from_code, to_code")
      .eq("type", type)
      .eq("from_code", from)
      .eq("to_code", to)
      .order("snapshot_date", { ascending: true })
      .limit(1000);

    if (historyError) throw historyError;

    const history = (historyRows || []).map(r => ({ date: r.snapshot_date, price: Number(r.price) })).filter(h => !isNaN(h.price));
    if (history.length === 0) {
      // still can fetch current availability and present "no history" to Gemini
    }

    // 2) Stats for route
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

    // 3) Current availability (to help suggest best items)
    let currentAvailability = [];
    if (type === "flight") {
      const offers = await searchFlights({ origin: from, destination: to, date: new Date().toISOString().split("T")[0] });
      // price each offer (best-effort)
      const pricedOffers = await Promise.all(offers.slice(0,6).map(async (o) => {
        try {
          const priced = await priceFlight({ flight: o });
          const p = Number(priced?.flightOffers?.[0]?.price?.total || null);
          const cabin = priced?.flightOffers?.[0]?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || "UNKNOWN";
          return { provider: o?.provider || "amadeus", price: p, cabin, raw: o };
        } catch (e) {
          return { provider: o?.provider || "amadeus", price: null, raw: o };
        }
      }));
      currentAvailability = pricedOffers;
    } else {
      const seats = await getTrainAvailability({ from, to, date: new Date().toISOString().split("T")[0] });
      const prices = await getTrainPrices({ from, to, date: new Date().toISOString().split("T")[0] }).catch(()=>[]);
      // join price info (if crawler returns trainNo/class)
      currentAvailability = seats.map(s => {
        const p = prices.find(x => (x.trainNo === s.trainNo && x.class === s.class) || x.class === s.class);
        return { trainNo: s.trainNo, class: s.class, availableSeats: s.availableSeats, price: p?.price ?? null };
      });
    }

    // 4) Top destinations (last 30 days overall) — load raw last 60 days and compute top targets
    const { data: recentRows } = await supabase
      .from("fare_history")
      .select("to_code")
      .gte("snapshot_date", new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString().split("T")[0]) // last 60 days
      .limit(10000);

    const destCounts = {};
    (recentRows || []).forEach(r => {
      if (!r.to_code) return;
      destCounts[r.to_code] = (destCounts[r.to_code] || 0) + 1;
    });
    const topDestinations = Object.entries(destCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([code,count])=>({ code, count }));

    // 5) Build prompt for Gemini
    const promptParts = [];
    promptParts.push(`You are a travel insights assistant. Provide a concise, actionable summary and bullet points.`);
    promptParts.push(`Route: ${from} → ${to} (${type})`);
    if (history.length > 0) {
      promptParts.push(`Historical fares (last ${history.length} snapshots): min ₹${minFare}, max ₹${maxFare}, avg ₹${Math.round(avgFare)}, volatility ₹${Math.round(volatility)}, cheapest day ${bestDay}.`);
    } else {
      promptParts.push(`No historical fare snapshots available.`);
    }
    promptParts.push(`Current availability (sample):`);
    if (currentAvailability.length === 0) promptParts.push("No current availability data found.");
    else currentAvailability.slice(0,6).forEach(a => {
      if (type === "flight") promptParts.push(`- Flight: cabin ${a.cabin}, price: ${a.price ?? "N/A"}`);
      else promptParts.push(`- Train ${a.trainNo} class ${a.class}, seats: ${a.availableSeats ?? "N/A"}, price: ${a.price ?? "N/A"}`);
    });
    promptParts.push(`Top destinations right now (by snapshots): ${topDestinations.map(d=>`${d.code}(${d.count})`).join(", ") || "N/A"}`);
    promptParts.push(`Tasks:
1) Give a short summary (2-4 sentences) of fare trends and whether to book now or wait.
2) Identify which flights/trains are cheapest right now and recommend the best price to look for.
3) Recommend top 3 actions for the traveler (e.g., best day to book, class to choose, alternate dates).
4) Give a short note about top destinations currently popular.`);

    const prompt = promptParts.join("\n");

    // 6) Call Gemini
    const genResp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { parts: [{ text: prompt }] }
      ],
      // optional: keep thinking disabled for speed if you prefer
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });

    const analysisText = genResp?.candidates?.[0]?.content?.parts?.[0]?.text || genResp?.text || "N
