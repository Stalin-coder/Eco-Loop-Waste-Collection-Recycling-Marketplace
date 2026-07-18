# ♻️ EcoLoop – AI-Powered Smart Waste Collection & Recycling Platform

EcoLoop is an AI-powered waste collection and recycling management platform that helps citizens, waste collectors, and municipalities manage waste efficiently. Using Google Gemini AI, EcoLoop identifies waste from uploaded images, recommends the correct disposal method, and enables seamless waste pickup scheduling with live tracking.

> Built for the **Idea2Impact 2026 Online Hackathon** under the **Clean & Green Technology** theme.

---

## 🌍 Problem Statement

Urban waste management faces several challenges:

- Poor waste segregation at the source.
- Low recycling rates due to incorrect disposal.
- Inefficient manual waste collection.
- Lack of transparency in waste pickup.
- Difficulty tracking waste from collection to recycling.

These issues lead to environmental pollution, overflowing landfills, and increased operational costs.

---

# 💡 Solution

EcoLoop provides an intelligent digital platform that simplifies waste management using Artificial Intelligence.

Users can:

- Upload a waste image.
- Get AI-powered waste identification.
- Receive disposal and recycling recommendations.
- Schedule waste pickups.
- Track collectors in real time.
- View pickup history.

Collectors receive optimized pickup requests while administrators monitor the complete system through an analytics dashboard.

---

# 🤖 AI Features

Google Gemini API is integrated at the core of EcoLoop.

### AI Waste Classification
- Detects waste type from uploaded images.
- Supports:
  - Plastic
  - Paper
  - Glass
  - Metal
  - Organic Waste
  - E-Waste

### Smart Disposal Recommendation

Based on the identified waste, EcoLoop recommends:

- Recycling method
- Disposal instructions
- Environmental impact

---

# ✨ Features

### 👤 User

- Secure Authentication
- Upload Waste Image
- AI Waste Detection
- Smart Recycling Suggestions
- Schedule Pickup
- Live Pickup Tracking
- Pickup History
- Notifications

---

### 🚛 Collector

- View Nearby Pickup Requests
- Accept Pickup
- Navigation Support
- Update Pickup Status
- Earnings Dashboard

---

### 🛠 Admin

- User Management
- Collector Management
- Pickup Monitoring
- Waste Analytics Dashboard
- Recycling Statistics
- Reports

---

# 🏗 Tech Stack

## Frontend

- React 18
- TypeScript
- Vite 5
- Tailwind CSS v3
- shadcn/ui

## Backend

- Supabase
- PostgreSQL
- Authentication
- Realtime Database

## Maps & Routing

- Leaflet
- OpenStreetMap
- OSRM Routing

## Artificial Intelligence

- Google Gemini API
---

---

# ⚙ Installation

Clone the repository

```bash
git clone https://github.com/Stalin-coder/ecoloop.git
```

Navigate to the project

```bash
cd ecoloop
```

Install dependencies

```bash
npm install
```

Create a `.env` file

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Run the project

```bash
npm run dev
```

Build for production

```bash
npm run build
```

---

# 🚀 Deployment

The application can be deployed on:

- Vercel

---

# 📸 Application Workflow

1. User logs in.
2. Uploads a waste image.
3. Gemini AI analyzes the image.
4. Waste category is identified.
5. Recycling recommendation is generated.
6. User schedules pickup.
7. Collector accepts request.
8. Live tracking begins.
9. Pickup completed.
10. Admin dashboard updates analytics.

---

# 🎯 Expected Impact

- Increase recycling rates.
- Improve waste segregation.
- Reduce landfill waste.
- Improve operational efficiency.
- Promote sustainable waste management.
- Support cleaner and greener cities.

---

# 🔮 Future Enhancements

- AI route optimization
- Carbon footprint calculator
- IoT smart bin integration
- Reward points for recycling
- Waste generation prediction
- Municipal analytics dashboard

---

# 👨‍💻 Developed By

**STALIN AREKALLU**

Idea2Impact 2026 Online Hackathon

Theme: **Clean & Green Technology**

---

# 📄 License

This project is developed for educational and hackathon purposes.
