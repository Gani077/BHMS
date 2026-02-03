# 🔋 Battery Health Monitoring System (BHMS)

A hardware-based battery protection and monitoring system that detects unsafe battery conditions such as overheating and low battery levels, and provides immediate alerts using a buzzer along with data visualization through a web interface.

🔗 **Live Demo (UI View):**  
https://gani077.github.io/BHMS/

---

## 📌 About the Project

Batteries can become dangerous when they overheat or discharge beyond safe limits.  
The **Battery Health Monitoring System (BHMS)** is designed to continuously monitor battery conditions and **alert the user immediately when unsafe situations occur**.

The primary goal of this project is **battery safety**, not just data display.  
Monitoring, alerting, and preventive indication are the core focus.

This project integrates **hardware sensing, Arduino-based control, alert mechanisms, and a simple web interface**.

---

## 🎯 Main Objectives

- Detect battery overheating conditions  
- Detect low battery levels  
- Trigger **buzzer alerts** for unsafe conditions  
- Provide real-time monitoring using serial communication  
- Display battery status in a simple web interface  

---

## ✨ Key Features

- Real-time battery monitoring  
- **Buzzer alert when battery overheats**  
- **Buzzer alert when battery level becomes low**  
- Arduino-controlled decision logic  
- Serial data monitoring using CoolTerm  
- Simple and clean web-based display  

---

## 🔌 Hardware Components Used

- Arduino board  
- Battery module  
- Temperature sensor  
- Voltage / current sensing components  
- Buzzer  
- Connecting wires and basic electronic components  

---

## 🧰 Software & Tools

- **Arduino IDE** – to write and upload code to the Arduino  
- **CoolTerm** – for serial communication and monitoring alerts/data  
- **HTML, CSS, JavaScript** – for the web interface  
- **GitHub Pages** – for hosting the UI  

---

## ⚙️ Working / System Flow

1. Battery voltage and temperature are continuously monitored using sensors.
2. Sensor data is processed by the Arduino.
3. If the battery **overheats**, the buzzer is activated immediately.
4. If the battery level goes **below the safe threshold**, the buzzer alerts the user.
5. Battery status and alert information are sent via serial communication.
6. **CoolTerm** displays real-time data for verification.
7. The web interface displays battery status for easy monitoring.

---

## 🚀 How to Run the Project

1. Connect the battery, sensors, and buzzer to the Arduino.
2. Upload the Arduino code using **Arduino IDE**.
3. Open **CoolTerm** to monitor serial output and alerts.
4. Open `index.html` in a browser or use the live demo link to view battery status.

---

## 📂 Project Structure
```
BHMS/
│── batterydata_converted.csv
│── cssbhms.css
│── dummy.ipynb
│── index.html
│── jsbhms.js
└── README.md
```
---

## 🔮 Future Improvements

- Add LCD or OLED display for hardware-side alerts  
- Implement SMS / app-based notifications  
- Add data logging for battery history  
- Improve alert accuracy with adaptive thresholds  

---

## 📖 Note

This project focuses on **battery safety and protection** through real-time monitoring and alert mechanisms.  
It is developed mainly for learning and practical implementation purposes.
