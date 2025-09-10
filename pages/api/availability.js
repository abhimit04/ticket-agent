import { searchFlights } from "../../adapters/flights/flightScraperSkyAdapter";
import { getFlightPrices } from "../../adapters/flights/flightScraperSkyAdapter";
//import { getTrainAvailability } from "../../adapters/trains/indianRailAdapter";
//import { getTrainPrices } from "../../adapters/trains/trainPricingCrawler";
import { saveFlightSnapshot, saveTrainSnapshot } from "../../lib/snapshotService";
import { getTrainAvailability } from "../../adapters/trains/trainScraper";

export default async function handler(req, res) {
    // ✅ Support both GET (req.query) and POST (req.body)
    const params = req.method === "POST" ? req.body : req.query;
    const { type, from, to, date } = params || {};

console.log("Incoming availability query:", req.query || req.body);

  if (!type || !from || !to || !date) {
    return res.status(400).json({ error: "Missing required params" });
  }

  try {
    // ---------------- FLIGHTS ----------------
    if (type === "flight") {
      const flights = await searchFlights({ origin: from, destination: to, date });
//      const prices = await getFlightPrices({ origin: from, destination: to, date });

//      const merged = schedules.map(s => {
//        const match = prices.find(p =>
//          p.airline?.toLowerCase() === s.airline?.toLowerCase()
//        );
//        return { ...s, price: match?.price || null, cabin: match?.cabin || null };
//      });

      console.log("Calling saveFlightSnapshot with:", { from, to, date });
      await saveFlightSnapshot(flights, { from, to, date });


      return res.json({ type, from, to, date, flights });
    }

    // ---------------- TRAINS ----------------
    if (type === "train") {
      const availability = await getTrainAvailability({ from, to, date });
      //const prices = await getTrainPrices({ from, to, date });

//      const merged = seats.map(s => {
//        const p = prices.find(x => x.class === s.class);
//        return { ...s, price: p?.price };
//      });

      await saveTrainSnapshot(availability, { from, to, date });

      return res.json({ type, from, to, date, availability });
    }

    res.status(400).json({ error: "Invalid type" });
  } catch (e) {
    console.error("Availability handler error:", e);
    res.status(500).json({ error: e.message });
  }
}
