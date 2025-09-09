import fetch from "node-fetch";

export async function getFlightPrices({ origin, destination, date }) {
  try {
    const url = `https://flight-scraper-sky.p.rapidapi.com/search-flights?from=${origin}&to=${destination}&date=${date}`;
    const resp = await fetch(url, {
      headers: {
        "x-rapidapi-host": "flight-scraper-sky.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY
      }
    });

    const data = await resp.json();
    if (!data?.flights) return [];

    return data.flights.map(f => ({
      flightNumber: f.flight_number || null,
      airline: f.airline || null,
      price: f.price || null,
      cabin: f.cabin || null
    }));
  } catch (err) {
    console.error("FlightScraperSky error:", err);
    return [];
  }
}
