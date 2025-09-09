// pages/api/collectFareSnapshot.js
import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    // Example: snapshot DEL → BOM flights
    const snapshot = {
      type: "flight",
      from_code: "DEL",
      to_code: "BOM",
      price: 5200,
      snapshot_date: new Date().toISOString().split("T")[0]
    };

    const { error } = await supabase.from("fare_history").insert([snapshot]);
    if (error) throw error;

    res.json({ message: "Snapshot saved", snapshot });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
