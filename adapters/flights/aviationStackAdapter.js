import fetch from "node-fetch";

const BASE_URL = "http://api.aviationstack.com/v1";

export async function searchFlights({ origin, destination, date }) {
  try {
    const url = `${BASE_URL}/flights?access_key=${process.env.AVIATIONSTACK_API_KEY}&dep_iata=${origin}&arr_iata=${destination}&flight_date=${date}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (!data?.data) return [];

    return data.data.map(flight => ({
      flightNumber: flight.flight?.iata,
      airline: flight.airline?.name,
      origin: flight.departure?.airport,
      destination: flight.arrival?.airport,
      departureTime: flight.departure?.scheduled,
      arrivalTime: flight.arrival?.scheduled,
      status: flight.flight_status
    }));
  } catch (err) {
    console.error("Aviationstack search error:", err);
    return [];
  }
}
