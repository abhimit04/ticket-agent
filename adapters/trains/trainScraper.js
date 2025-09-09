import axios from "axios";
import cheerio from "cheerio";

/**
 * Scrape train availability and fare from IRCTC or erail.in
 * @param {string} from - source station code
 * @param {string} to - destination station code
 * @param {string} date - YYYY-MM-DD
 */
export async function getTrainAvailability({ from, to, date }) {
  try {
    const url = `https://erail.in/trains-between-stations/${from}/${to}?date=${date}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const trains = [];

    $("table#trains-table tbody tr").each((i, row) => {
      const tds = $(row).find("td");
      trains.push({
        trainName: $(tds[1]).text().trim(),
        trainNumber: $(tds[0]).text().trim(),
        departure: $(tds[2]).text().trim(),
        arrival: $(tds[3]).text().trim(),
        classes: $(tds[4]).text().trim().split(","),
        // placeholder for availability/fare scraping (can extend)
        availability: null,
        price: null
      });
    });

    return trains;
  } catch (err) {
    console.error("Train scraper error:", err.message);
    return [];
  }
}
