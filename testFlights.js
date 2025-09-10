import { searchFlights } from "../..ticket-agent/adapters/flights/flightScraperSkyAdapter";

(async () => {
  const origin = "DEL";
  const destination = "BOM";
  const date = "2025-09-15";

  const flights = await searchFlights({ origin, destination, date });

  if (!flights.length) {
    console.log("No flights returned. Check API key or parameters.");
    return;
  }

  console.table(
    flights.map(f => ({
      Flight: f.flightNumber,
      Airline: f.airline,
      Departure: f.departure,
      Arrival: f.arrival,
      Duration: f.duration,
      Stops: f.stops,
      Cabin: f.cabin,
      Price: f.price ? `${f.price} ${f.currency}` : "N/A"
    }))
  );
})();