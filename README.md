# Mobile POS (Point of Sale) System

A modern, full-stack Mobile Point of Sale (POS) application built with React Native (Expo) and Node.js. This system allows businesses to manage inventory, process sales, and print thermal receipts directly from a mobile device.

## 🚀 Features

- **📊 Dashboard**: Real-time overview of sales and business metrics.
- **🛒 POS Billing**: Easy-to-use interface for processing customer orders and payments.
- **📦 Inventory Management**: Track products, stock levels, and pricing.
- **🖨️ Thermal Printing**: Support for thermal receipt printers via Bluetooth/USB/Network.
- **🔄 State Management**: Robust state handling using Redux Toolkit.
- **📱 Cross-Platform**: Runs on Android and iOS thanks to Expo.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React Native (Expo SDK 51)
- **Navigation**: React Navigation (Bottom Tabs)
- **State Management**: Redux Toolkit
- **Styling**: React Native StyleSheet
- **API Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Environment**: Dotenv

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or newer)
- [MongoDB](https://www.mongodb.com/try/download/community) (Running locally or a cloud URI)
- [Expo Go](https://expo.dev/go) app on your mobile device (for testing)

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/mobile-pos.git
cd mobile-pos
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (optional if using defaults):
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/mobile_pos
   ```
4. Start the backend:
   ```bash
   node server.js
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   *Note: Use `--legacy-peer-deps` to handle older native printer libraries.*
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Expo server:
   ```bash
   npm start
   ```

---

## 📱 Running the App

1. Ensure your backend is running.
2. Ensure your mobile device and computer are on the **same Wi-Fi network**.
3. Scan the QR code displayed in the terminal using the **Expo Go** app.
4. If you face issues with Expo Go version mismatch (e.g., Device has SDK 54 but project is SDK 51), you can upgrade the project by running:
   ```bash
   npx expo install expo@latest --fix
   ```

---

## 📂 Project Structure

```text
├── backend/
│   ├── controllers/    # Request handlers
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API endpoints
│   └── server.js       # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── navigation/ # React Navigation setup
│   │   ├── redux/      # Store and slices (cart, inventory)
│   │   ├── screens/    # Main application screens
│   │   ├── services/   # API calling logic
│   │   └── utils/      # Helper functions
│   ├── App.tsx         # Root component
│   └── app.json        # Expo configuration
└── README.md
```

## 🤝 Contributing
Feel free to fork this project, submit issues, or create pull requests to improve the system!

## 📄 License
This project is licensed under the ISC License.
