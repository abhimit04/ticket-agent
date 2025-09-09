import { searchFlights } from "../../adapters/flights/aviationStackAdapter";
import { getFlightPrices } from "../../adapters/flights/flightScraperSkyAdapter";
//import { getTrainAvailability } from "../../adapters/trains/indianRailAdapter";
//import { getTrainPrices } from "../../adapters/trains/trainPricingCrawler";
import { saveFlightSnapshot, saveTrainSnapshot } from "../../lib/snapshotService";
import { getTrainAvailability } from "../../adapters/trains/trainScraper";

async function saveFlightSnapshot({ from, to, date, price, cabin }) {
  if (!from || !to) {
    throw new Error("Missing 'from' or 'to' in saveFlightSnapshot()");
  }
  return supabase.from("fare_history").insert([
    {
      type: "flight",
      from_code: from,
      to_code: to,
      snapshot_date: new Date().toISOString().split("T")[0],
      price,
      cabin
    }
  ]);
}

async function saveTrainSnapshot({ from, to, date, trainNo, cls, price }) {
  if (!from || !to) {
    throw new Error("Missing 'from' or 'to' in saveTrainSnapshot()");
  }
  return supabase.from("fare_history").insert([
    {
      type: "train",
      from_code: from,
      to_code: to,
      snapshot_date: new Date().toISOString().split("T")[0],
      price,
      train_no: trainNo,
      class: cls
    }
  ]);
}

export default async function handler(req, res) {
  try {
    const { type, from, to, date } = req.method === "GET" ? req.query : req.body;

    if (!type || !from || !to || !date) {
      return res.status(400).json({ error: "type, from, to, date required" });
    }

    if (type === "flight") {
      const flights = await searchFlights({ origin: from, destination: to, date });
      const results = [];
      for (const f of flights.slice(0, 5)) {
        try {
          const priced = await priceFlight({ flight: f });
          const total = Number(priced?.flightOffers?.[0]?.price?.total || 0);
          const cabin =
            priced?.flightOffers?.[0]?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]
              ?.cabin || "UNKNOWN";
          await saveFlightSnapshot({ from, to, date, price: total, cabin });
          results.push({ price: total, cabin });
        } catch (err) {
          console.error("Flight pricing error:", err);
        }
      }
      return res.json({ flights: results });
    } else if (type === "train") {
      const trains = await getTrainAvailability({ from, to, date });
      const results = [];
      for (const t of trains) {
        await saveTrainSnapshot({
          from,
          to,
          date,
          trainNo: t.trainNo,
          cls: t.class,
          price: t.price ?? null
        });
        results.push(t);
      }
      return res.json({ trains: results });
    } else {
      return res.status(400).json({ error: "Invalid type (flight/train)" });
    }
  } catch (error) {
    console.error("Availability handler error:", error);
    res.status(500).json({ error: error.message || "Internal error" });
  }
}
