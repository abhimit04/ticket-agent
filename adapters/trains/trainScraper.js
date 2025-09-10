import axios from "axios";
import cheerio from "cheerio";

/**
 * Scrape Trainman for train availability & fare
 * @param {string} from - station code (e.g. NDLS)
 * @param {string} to - station code (e.g. BCT)
 * @param {string} date - YYYY-MM-DD
 */
export async function getTrainAvailability({ from, to, date }) {
  try {
    const url = `https://www.trainman.in/trains/${from}-${to}-${date}`;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const $ = cheerio.load(data);
    const trains = [];

    $(".train-card").each((i, card) => {
      const trainName = $(card).find(".train-name").text().trim();
      const trainNumber = $(card).find(".train-no").text().trim();
      const departure = $(card).find(".train-depart").text().trim();
      const arrival = $(card).find(".train-arrive").text().trim();

      const classes = [];
      $(card)
        .find(".class-availability")
        .each((j, cls) => {
          classes.push({
            class: $(cls).find(".class-name").text().trim(),
            availability: $(cls).find(".status-text").text().trim(),
            fare: $(cls).find(".fare").text().trim(),
          });
        });

      trains.push({ trainName, trainNumber, departure, arrival, classes });
    });

    return trains;
  } catch (err) {
    console.error("Trainman scraper error:", err.message);
    return [];
  }
}
