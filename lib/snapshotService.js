import { supabaseServer } from "./supabaseClient"; // Use server-side client for inserts

/**
 * Save flight snapshot
 */
export async function saveFlightSnapshot(flights = [], query = {}) {
  console.log("saveFlightSnapshot received query:", query);

  const from = query?.from || null;
  const to = query?.to || null;
  const date = query?.date || null;

  if (!from || !to || !date) {
    console.error("❌ saveFlightSnapshot missing required params", query);
    return; // early exit, don’t insert bad rows
  }

  if (!flights || flights.length === 0) {
    console.warn("⚠️ No flights provided, skipping snapshot");
    return;
  }

  const { error } = await supabase.from("fare_history").insert(
    flights.map((f) => ({
      type: "flight",
      from_code: from,
      to_code: to,
      snapshot_date: date,
      price: f.price || null,
      airline: f.airline || null,
      cabin: f.cabin || null,
    }))
  );

  if (error) {
    console.error("❌ Supabase insert error:", error);
    throw error;
  }

  console.log(`✅ Saved ${flights.length} flight snapshot(s) for ${from} → ${to} on ${date}`);
}

/**
 * Save train snapshot
 * Handles scraper data: multiple classes with availability
 */


  // Flatten classes and availability if scraper returns multiple classes
  export async function saveTrainSnapshot(trains = [], query = {}) {
    console.log("saveTrainSnapshot received query:", query);

    const from = query?.from || null;
    const to = query?.to || null;
    const date = query?.date || null;

    if (!from || !to || !date) {
      console.error("❌ saveTrainSnapshot missing required params", query);
      return; // early exit
    }

    if (!trains || trains.length === 0) {
      console.warn("⚠️ No train availability provided, skipping snapshot");
      return;
    }

    const { error } = await supabase.from("fare_history").insert(
      trains.map((t) => ({
        type: "train",
        from_code: from,
        to_code: to,
        snapshot_date: date,
        price: t.price || null,
        train_number: t.trainNumber || null,
        train_name: t.trainName || null,
        class: t.class || null,
        available: t.available || null,
      }))
    );

    if (error) {
      console.error("❌ Supabase insert error (train):", error);
      throw error;
    }

    console.log(`✅ Saved ${trains.length} train snapshot(s) for ${from} → ${to} on ${date}`);
  }