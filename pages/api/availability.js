import { searchFlights } from "../../adapters/flights/aviationStackAdapter";
import { getFlightPrices } from "../../adapters/flights/flightScraperSkyAdapter";
import { getTrainAvailability } from "../../adapters/trains/indianRailAdapter";
import { getTrainPrices } from "../../adapters/trains/trainPricingCrawler";
import { saveFlightSnapshot, saveTrainSnapshot } from "../../lib/snapshotService";

export default async function handler(req, res) {
  const { type, from, to, date } = req.query;
  if (!type || !from || !to || !date) {
    return res.status(400).json({ error: "Missing required params" });
  }

  try {
    if (type === "flight") {
      const schedules = await searchFlights({ origin: from, destination: to, date });
      const prices = await getFlightPrices({ origin: from, destination: to, date });

      const merged = schedules.map(s => {
        const match = prices.find(p =>
          p.airline?.toLowerCase() === s.airline?.toLowerCase()
        );
        return { ...s, price: match?.price || null, cabin: match?.cabin || null };
      });

      await saveFlightSnapshot(merged, { from, to, date });

      return res.json({ type, from, to, date, flights: merged });
    }

    if (type === "train") {
      const seats = await getTrainAvailability({ from, to, date });
      const prices = await getTrainPrices({ from, to, date });
      const merged = seats.map(s => {
        const p = prices.find(x => x.class === s.class);
        return { ...s, price: p?.price };
      });

      await saveTrainSnapshot(merged, { from, to, date });

      return res.json({ type, from, to, date, availability: merged });
    }

    res.status(400).json({ error: "Invalid type" });
  } catch (e) {
    console.error("Availability handler error:", e);
    res.status(500).json({ error: e.message });
  }
}
