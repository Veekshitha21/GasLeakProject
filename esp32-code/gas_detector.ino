// #include <WiFi.h>
// #include <Firebase_ESP_Client.h>

// // ---------------- WIFI DETAILS ----------------
// #define WIFI_SSID "YOUR_WIFI_NAME"
// #define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// // ---------------- FIREBASE DETAILS ----------------
// #define API_KEY "YOUR_FIREBASE_API_KEY"
// #define DATABASE_URL "https://gasleakdetector-aa2bc-default-rtdb.asia-southeast1.firebasedatabase.app/"

// // ---------------- SENSOR PIN ----------------
// #define MQ2_PIN 34

// FirebaseData fbdo;
// FirebaseAuth auth;
// FirebaseConfig config;

// void setup() {
//   Serial.begin(115200);

//   pinMode(MQ2_PIN, INPUT);

//   // CONNECT TO WIFI
//   WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
//   Serial.print("Connecting to WiFi");

//   while (WiFi.status() != WL_CONNECTED) {
//     Serial.print(".");
//     delay(1000);
//   }

//   Serial.println();
//   Serial.println("WiFi Connected!");

//   // CONNECT TO FIREBASE
//   config.api_key = API_KEY;
//   config.database_url = DATABASE_URL;

//   Firebase.begin(&config, &auth);
//   Firebase.reconnectWiFi(true);

//   Serial.println("Firebase Connected!");
// }

// void loop() {
//   int gasValue = analogRead(MQ2_PIN);

//   Serial.print("Gas Value: ");
//   Serial.println(gasValue);

//   // SEND GAS VALUE TO FIREBASE
//   Firebase.RTDB.setInt(&fbdo, "/gasDetector/gasValue", gasValue);

//   // CHECK GAS STATUS
//   if (gasValue > 1800) {
//     Firebase.RTDB.setString(&fbdo, "/gasDetector/status", "LEAK");
//     Serial.println("⚠ LEAK DETECTED!");
//   } else {
//     Firebase.RTDB.setString(&fbdo, "/gasDetector/status", "SAFE");
//     Serial.println("SAFE");
//   }

//   delay(2000);
// }