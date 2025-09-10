import { searchFlights } from "../../adapters/flights/flightScraperSkyAdapter";

(async () => {
  const flights = await searchFlights({
    origin: "DEL",        // example: Delhi
    destination: "BOM",   // example: Mumbai
    date: "2025-09-15"    // example date
  });

  console.log("Flights fetched:", flights);
})();
