# 🌍 Africa Calendar

An interactive web application that visualizes **African history through a dynamic calendar system**.

Each date on the calendar can contain historical events loaded from a dataset, allowing users to explore Africa’s rich past in an engaging and visual way.

---

## ✨ Concept

Africa Calendar transforms historical data into an **interactive calendar experience**:

- 📅 Each day can contain one or more historical events
- 🧠 Data is loaded dynamically from a structured dataset
- 🖱️ Clicking an event opens an animated popup modal
- 🌍 Focused on African history, culture, discoveries, and events

---

## 🚀 Features

- 📊 Dynamic calendar generation from data
- 🧾 External dataset support (JSON / Excel converted structure)
- 🖱️ Clickable event cards per date
- 💡 Modal popup with full event details
- 🎞️ Smooth animations (fade + scale transitions)
- 📱 Responsive design (mobile + desktop ready)
- 🧩 Clean and modular JavaScript architecture

---

## 🧱 Data Structure

Events are stored in the following format:

```js
{
  date: "YYYY-MM-DD",
  event: "string",
  type: "string",
  country: "string",
  description: "string"
}
