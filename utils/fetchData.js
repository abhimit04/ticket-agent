// utils/fetchData.js
import fetch from "node-fetch";

// Mock function: Replace with actual API calls to Skyscanner, MakeMyTrip, EaseMyTrip, IRCTC
export async function fetchFlightAvailability(from, to, date) {
  // Example: Only economy & business
  return [
    { airline: "IndiGo", class: "Economy", availableSeats: 20, price: 4500 },
    { airline: "Air India", class: "Business", availableSeats: 5, price: 12000 },
  ];
}

export async function fetchTrainAvailability(from, to, date) {
  // All IRCTC bookable classes
  return [
    { train: "12345 Express", class: "SL", availableSeats: 30, price: 500 },
    { train: "12345 Express", class: "3A", availableSeats: 10, price: 1200 },
    { train: "12345 Express", class: "2A", availableSeats: 5, price: 2000 },
    { train: "12345 Express", class: "1A", availableSeats: 2, price: 4000 },
  ];
}

// Dynamic pricing mock: last 2 months
export async function fetchFareTrends(type, from, to) {
  // Return last 60 days of fares (mock)
  const today = new Date();
  const trends = [];
  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    trends.push({
      date: date.toISOString().split("T")[0],
      price: Math.floor(Math.random() * 2000 + 500), // mock price
    });
  }
  return trends;
}
