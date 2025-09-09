// pages/api/fareTrends.js
import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  const { type, from, to } = req.query;

  if (!type || !from || !to) {
    return res.status(400).json({ error: "Missing params" });
  }

  try {
    const { data, error } = await supabase
      .from("fare_history")
      .select("snapshot_date, price")
      .eq("type", type)
      .eq("from_code", from)
      .eq("to_code", to)
      .order("snapshot_date", { ascending: true })
      .limit(60);

    if (error) throw error;

    res.json({ from, to, type, fares: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
