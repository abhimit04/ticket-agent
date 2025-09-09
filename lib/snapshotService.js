import { supabaseServer } from "./supabaseClient"; // Use server-side client for inserts

/**
 * Save flight snapshot
 */
export async function saveFlightSnapshot(flights, query={}) {
   console.log("saveFlightSnapshot received query:", query);
   const { from, to, date } = query || {};
     if (!from || !to || !date) {
       throw new Error("saveFlightSnapshot missing from/to/date");
     }

  const { error } = await supabaseServer.from("flights_snapshots").insert(
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

  if (error) console.error("Supabase insert error (flights):", error);
}

/**
 * Save train snapshot
 * Handles scraper data: multiple classes with availability
 */
export async function saveTrainSnapshot(trains, query) {
  const { from, to, date } = query;

  // Flatten classes and availability if scraper returns multiple classes
  const flattened = [];
  trains.forEach(train => {
    if (train.classes && Array.isArray(train.classes)) {
      train.classes.forEach(cls => {
        flattened.push({
          origin: from,
          destination: to,
          date: date,
          train_name: train.trainName,
          train_number: train.trainNumber || null,
          class: cls,
          available: train.availability || null,
          price: train.price || null,
          departure_time: train.departure || null,
          arrival_time: train.arrival || null
        });
      });
    } else {
      flattened.push({
        origin: from,
        destination: to,
        date: date,
        train_name: train.trainName,
        train_number: train.trainNumber || null,
        class: train.class || null,
        available: train.availability || null,
        price: train.price || null,
        departure_time: train.departure || null,
        arrival_time: train.arrival || null
      });
    }
  });

  const { error } = await supabaseServer.from("trains_snapshots").insert(flattened);

  if (error) console.error("Supabase insert error (trains):", error);
}
