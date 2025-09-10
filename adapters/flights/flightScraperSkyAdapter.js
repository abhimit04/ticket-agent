import fetch from "node-fetch";

export async function searchFlights({ origin, destination, date }) {
  try {
    const url = `https://flight-sky.p.rapidapi.com/search-flights?from=${origin}&to=${destination}&date=${date}`;
    const resp = await fetch(url, {
      headers: {
        "x-rapidapi-host": "flight-sky.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY
      }
    });

    const data = await resp.json();
    if (!data?.flights) return [];

    return data.flights.map(f => ({
      flightNumber: f.flight_number || null,
      airline: f.airline || null,
      departure: f.departure_time || null,
      arrival: f.arrival_time || null,
      duration: f.duration || null,
      stops: f.stops || 0,
      cabin: f.cabin || "economy",
      price: f.price || null,
      currency: f.currency || "INR"
    }));
  } catch (err) {
    console.error("FlightScraperSky error:", err);
    return [];
  }
}
