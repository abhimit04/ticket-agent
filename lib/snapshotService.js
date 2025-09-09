import { supabase } from "./supabaseClient";

export async function saveFlightSnapshot(flights, query) {
  const { from, to, date } = query;

  const { error } = await supabase.from("flights_snapshots").insert(
    flights.map(f => ({
      origin: from,
      destination: to,
      date: date,
      airline: f.airline,
      flight_number: f.flightNumber,
      departure_time: f.departureTime,
      arrival_time: f.arrivalTime,
      cabin: f.cabin,
      price: f.price,
      status: f.status
    }))
  );

  if (error) console.error("Supabase insert error:", error);
}

export async function saveTrainSnapshot(trains, query) {
  const { from, to, date } = query;

  const { error } = await supabase.from("trains_snapshots").insert(
    trains.map(t => ({
      origin: from,
      destination: to,
      date: date,
      train_name: t.trainName,
      class: t.class,
      available: t.available,
      price: t.price
    }))
  );

  if (error) console.error("Supabase insert error:", error);
}
