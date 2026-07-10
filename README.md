# 🔍 Spot the Difference

A fun, browser-based spot-the-difference game built with React, Vite, and Tailwind CSS. Each round features procedurally generated geometric patterns — no two games are alike!

![Game Preview](https://img.shields.io/badge/Status-Playable-brightgreen) ![React](https://img.shields.io/badge/React-19-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-cyan)

---

## 🎮 How to Play

1. **Choose your difficulty** — Easy, Medium, or Hard
2. **Toggle Timer Mode** on or off depending on your preference
3. **Click Start Game** to begin
4. Two side-by-side images appear — one original, one modified
5. **Click on either image** where you spot a difference
6. Find all differences before time runs out (if timer is on) to win!

---

## ✨ Features

| Feature | Description |
|---|---|
| **Procedural Generation** | Each round creates unique patterns using 7 shape types (circle, square, triangle, diamond, star, hexagon, cross) in random colors, sizes, and rotations |
| **Side-by-Side Canvases** | Two HTML5 Canvas panels displaying original vs. modified patterns |
| **Click-to-Mark** | Click a difference to mark it with a green circle + checkmark. Wrong clicks show a red ✕ |
| **Difference Counter** | Live progress bar showing found / total differences |
| **Timer Mode** | Countdown timer with visual bar and pulsing warning when time is low. Can be toggled off for relaxed play |
| **3 Difficulty Levels** | Easy (3 diffs, 12 shapes, 90s), Medium (5 diffs, 20 shapes, 60s), Hard (7 diffs, 30 shapes, 45s) |
| **Hint System** | 3 hints per game — highlights an unfound difference with a bouncing amber circle |
| **Scoring** | Points based on differences found, time bonus, miss penalties, and hint penalties |
| **Multiple Rounds** | Continue to new rounds after winning with cumulative score tracking |
| **Responsive Design** | Canvas sizes adapt to mobile, tablet, and desktop screens |
| **Dark Theme UI** | Gradient backgrounds, glassmorphism cards, and polished animations |

---

## 🏗️ Tech Stack

- **React 19** — UI components and state management
- **Vite 7** — Fast dev server and build tooling
- **Tailwind CSS 4** — Utility-first styling
- **HTML5 Canvas** — Procedural pattern rendering
- **TypeScript** — Full type safety

---

## 📁 Project Structure

```
├── index.html                  # Entry HTML
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Main game component (menu, playing, win/loss screens)
│   ├── index.css               # Tailwind imports & custom styles
│   ├── types.ts                # TypeScript type definitions
│   ├── components/
│   │   └── GameCanvas.tsx      # Canvas component for rendering patterns
│   └── utils/
│       ├── cn.ts               # Classname utility
│       └── patternGenerator.ts # Shape generation, level creation, canvas rendering
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm**

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The dev server runs at `http://localhost:5173` by default.

---

## 🎯 Game Mechanics

### Differences
Shapes between the two images can differ in:
- **Color** — a shape changes to a different color
- **Shape Type** — e.g., a circle becomes a star
- **Size** — a shape grows larger or shrinks smaller
- **Rotation** — a shape rotates to a different angle

### Scoring
```
Round Score = (Differences × 100) + Time Bonus − Miss Penalty − Hint Penalty

Time Bonus (timer mode):  timeLeft × 10
Time Bonus (free mode):   max(0, 300 − elapsed × 2)
Miss Penalty:             wrongClicks × 25
Hint Penalty:             50 (if any hint was used)
```

---

## 📄 License

MIT — free to use, modify, and distribute.
