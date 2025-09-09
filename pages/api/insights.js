import { supabase } from "../../lib/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  try {
    const { type } = req.query;

    if (!type || !["flight", "train"].includes(type)) {
      return res.status(400).json({ error: "Invalid type. Use flight or train." });
    }

    // Fetch last 2 months of snapshots
    const since = new Date();
    since.setMonth(since.getMonth() - 2);

    let snapshots = [];
    if (type === "flight") {
      const { data, error } = await supabase
        .from("flights_snapshots")
        .select("*")
        .gte("date", since.toISOString().split("T")[0]);

      if (error) throw error;
      snapshots = data;
    } else {
      const { data, error } = await supabase
        .from("trains_snapshots")
        .select("*")
        .gte("date", since.toISOString().split("T")[0]);

      if (error) throw error;
      snapshots = data;
    }

    if (!snapshots.length) {
      return res.json({ message: "No data available for insights yet." });
    }

    // Prepare prompt for Gemini
    const prompt = `
      You are an AI travel analyst.
      Analyze the following ${type} snapshot data from the last 2 months.
      Provide:
      - Cheapest routes
      - Average fare trends
      - Popular destinations
      - Cabin/class preferences
      - Suggest the best travel options currently

      Data: ${JSON.stringify(snapshots.slice(0, 200))}
      (only showing sample if too long)
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const aiText = result.response.text();

    return res.json({
      type,
      insights: aiText,
    });
  } catch (err) {
    console.error("Insights error:", err);
    res.status(500).json({ error: err.message });
  }
}
