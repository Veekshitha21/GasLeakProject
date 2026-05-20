# Gas Leakage Detection and Alert System

## Project Overview
This project is an IoT-based Gas Leakage Detection and Alert System designed to detect harmful gas leaks and provide real-time alerts through a website notification system.

The system uses an MQ2 gas sensor connected to an ESP32 microcontroller. The ESP32 reads gas concentration values and sends them to Firebase Realtime Database. A web dashboard continuously monitors the data and displays live gas values and status updates. If dangerous gas levels are detected, the system triggers an instant browser notification alert.

---

## Features
- Real-time gas leakage detection
- Live gas value monitoring
- SAFE / LEAK status indication
- Browser notification alerts
- Firebase cloud database integration
- ESP32 WiFi connectivity
- Simple web dashboard interface

---

## Technologies Used

### Hardware
- ESP32
- MQ2 Gas Sensor
- Jumper Wires
- Breadboard
- Power Supply

### Software
- Arduino IDE
- Visual Studio Code
- Firebase Realtime Database
- HTML
- CSS
- JavaScript

---

## Project Architecture

MQ2 Gas Sensor
↓
ESP32 Microcontroller
↓
WiFi Connection
↓
Firebase Realtime Database
↓
Web Dashboard
↓
Browser Notification Alert

---

## Folder Structure

```bash
GasLeakProject/
│
├── esp32-code/
│   └── gas_detector.ino
│
├── website/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
└── README.md