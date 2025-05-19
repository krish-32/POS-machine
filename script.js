// Your web app's Firebase configuration

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getDatabase,
  get,
  ref,
  query,
  orderByChild,
  equalTo,
  update,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAhVM_67ccGQTopP5dHagx_450WSxodhNk",
  authDomain: "navigo-a1d82.firebaseapp.com",
  databaseURL: "https://navigo-a1d82-default-rtdb.firebaseio.com",
  projectId: "navigo-a1d82",
  storageBucket: "navigo-a1d82.firebasestorage.app",
  messagingSenderId: "1089058806418",
  appId: "1:1089058806418:web:2100a065ff89023572e44b",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const routes = {
  "Ramanathapuram|Paramakudi": 25,
  "Ramanathapuram|Manamadurai": 40,
  "Ramanathapuram|Madurai": 75,
  "Paramakudi|Manamadurai": 18,
  "Paramakudi|Madurai": 50,
  "Manamadurai|Madurai": 30,
};

const from = document.getElementById("from");
const to = document.getElementById("to");
const adultQty = document.getElementById("adultQty");
const childQty = document.getElementById("childQty");
const adultGender = document.getElementById("adultGender");
const childGender = document.getElementById("childGender");
const totalDisplay = document.getElementById("totalDisplay");

const ADULT_MULTIPLIER = 1;
const CHILD_MULTIPLIER = 0.5;

function getBaseFare() {
  const routeKey = `${from.value}|${to.value}`;
  const reverseKey = `${to.value}|${from.value}`;
  return routes[routeKey] || routes[reverseKey] || 0;
}

function updateTotal() {
  const baseFare = getBaseFare();
  const adults = parseInt(adultQty.value) || 0;
  const children = parseInt(childQty.value) || 0;
  const ag = adultGender.value;
  const cg = childGender.value;

  const adultFare = ag === "Female" ? 0 : baseFare * ADULT_MULTIPLIER * adults;
  const childFare = cg === "Female" ? 0 : baseFare * CHILD_MULTIPLIER * children;
  const count = adults + children;

  const total = (adultFare + childFare).toFixed(2);
  totalDisplay.textContent = `Total: ₹${total}`;
  return { baseFare, adults, children, total, ag, cg, count };
}

from.addEventListener("change", updateTotal);
to.addEventListener("change", updateTotal);
adultQty.addEventListener("input", updateTotal);
childQty.addEventListener("input", updateTotal);
adultGender.addEventListener("change", updateTotal);
childGender.addEventListener("change", updateTotal);

async function printTicket() {
  const { baseFare, adults, children, total, ag, cg, count } = updateTotal();

  const popup = window.open("", "", "width=300,height=400");
  popup.document.write(`
    <html>
    <head><title>Bus Ticket</title></head>
    <body style="font-family: Arial; padding: 20px;">
      <h2 style="text-align:center;">🚌 Bus Ticket</h2>
      <p><strong>From:</strong> ${from.value}</p>
      <p><strong>To:</strong> ${to.value}</p>
      <hr>
      ${
        adults > 0
          ? `<p>Adult (${ag}) x ${adults} — ₹${
              ag === "Female" ? "0.00" : (baseFare * ADULT_MULTIPLIER * adults).toFixed(2)
            }</p>`
          : ""
      }
      ${
        children > 0
          ? `<p>Child (${cg}) x ${children} — ₹${
              cg === "Female" ? "0.00" : (baseFare * CHILD_MULTIPLIER * children).toFixed(2)
            }</p>`
          : ""
      }
      <hr>
      <p><strong>Total:</strong> ₹${total}</p>
      <p style="margin-top:2rem;">Thank you & safe travels!</p>
      <script>window.print();</script>
    </body>
    </html>
  `);

  await incrementBusCountByNumber("6A", count, to.value);

  popup.document.close();
}

async function incrementBusCountByNumber(busNumber, incrementValue = 1, destination) {
  try {
    const busRef = ref(db, "seatCount");

    const busQuery = query(busRef, orderByChild("number"), equalTo(busNumber));
    const snapshot = await get(busQuery);

    if (snapshot.exists()) {
      snapshot.forEach(async (childSnapshot) => {
        const key = childSnapshot.key;
        const currentData = childSnapshot.val();

        const seats = currentData.seats || {};

        const destinationKey = destination.toLowerCase().replace(/\s+/g, "");

        const currentCount = seats[destinationKey] || 0;

        await update(ref(db, `seatCount/${key}/seats`), {
          [destinationKey]: currentCount + incrementValue,
        });

        console.log(
          `Updated seat count in ${destinationKey} for bus ${busNumber} is ${
            currentCount + incrementValue
          }`
        );
      });
    } else {
      console.log("Bus not found with number:", busNumber);
    }
  } catch (error) {
    console.log("Something went wrong please try again later");
  }
}

updateTotal();
window.printTicket = printTicket;
