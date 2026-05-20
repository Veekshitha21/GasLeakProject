import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfuCbRaqxkMQTjm7dIqhDBSDVd5RkJHM4",
  authDomain: "gasleakdetector-aa2bc.firebaseapp.com",
  databaseURL: "https://gasleakdetector-aa2bc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gasleakdetector-aa2bc",
  storageBucket: "gasleakdetector-aa2bc.firebasestorage.app",
  messagingSenderId: "878891852662",
  appId: "1:878891852662:web:0c457a7f49573951ead057",
  measurementId: "G-04P4WCHNR6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const statusElement = document.getElementById("status");
const gasValueElement = document.getElementById("gasValue");

Notification.requestPermission();

let alerted = false;

const gasRef = ref(db, "gasDetector");

onValue(gasRef, (snapshot) => {
    const data = snapshot.val();

    if (data) {
        const gasValue = data.gasValue;
        const status = data.status;

        gasValueElement.textContent = gasValue;
        statusElement.textContent = status;

        if (status === "LEAK") {
            statusElement.className = "danger";

            if (!alerted) {
                new Notification("⚠ Gas Leakage Detected!", {
                    body: "Immediate action required!"
                });
                alerted = true;
            }

        } else {
            statusElement.className = "safe";
            alerted = false;
        }
    }
});