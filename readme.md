# Hamming Code Simulator - 64-bit Professional Lab

## 🔬 Project Overview

This is a **Professional Web-Based Educational Simulation of Hamming Code** designed for Computer Organization and Architecture coursework. The project demonstrates the complete process of **Single Bit Error Detection and Correction (SEC)** using the Hamming Code algorithm. It provides an interactive, step-by-step visualization of how 64-bit data is encoded with parity bits into a 71-bit codeword, transmitted through a noisy channel, and then decoded to detect and correct single-bit errors.

### Key Features:
- 🛡️ **SEC Algorithm**: Single Error Correction using 7 parity bits (71-bit total length). No automatic skips—full manual workflow to enforce learning.
- 📐 **Mathematical Foundations**: Interactive parity coverage and dynamic generation of **Generator (G)** and **Parity-Check (H)** matrices based on actual simulated data.
- 🎨 **Premium UI/UX**: Professional technical laboratory design with a dashboard and distinct interactive workspaces. 
- 🔍 **Visual Diagnostics**: Grouped bit visualization for 71-bit codewords, highlighting data bits, parity bits, errors, and corrections.
- 🧮 **Flexible Input**: Supports exactly 64 bits of data, with the option to auto-generate random data.

---

## 🛠️ Technologies Used

### Frontend Technologies:
- **HTML5**: Semantic markup and structural layout.
- **CSS3**: Modern styling with CSS Grid layout, utilizing a professional Light/Gray technical theme.
- **Vanilla JavaScript (ES6+)**: Core mathematical algorithm implementation, manual state machine, and DOM manipulation.

### Design & Libraries:
- **Google Fonts**: JetBrains Mono (monospace) and Inter (sans-serif) fonts.
- **SVG Icons**: Inline SVG graphics for visual feedback.
- **CSS Layout**: Highly responsive sidebar and workspace layout utilizing Flexbox and CSS Grid.

### No Backend or External Dependencies:
- 100% client-side processing.
- No server required.
- No external libraries or frameworks (pure vanilla JS).

---

## 📂 Project Structure

```
Hamming Simulation/
├── index.html          # Main HTML structure and UI views
├── script.js           # Core JavaScript logic & state machine
├── style.css           # Professional technical styling
└── README.md           # Project documentation
```

### File Descriptions:

**index.html**
- Defines the modern dashboard layout: Sidebar, Header, Main Workspace.
- Contains all interactive view sections: Dashboard, Encode, Inject Error, Detect, Correct, Verify, Mathematics.
- Enforces proper staging logic and locks/unlocks sections.

**script.js**
- Strict **71-bit SEC algorithm** (64 data + 7 parity).
- Global state management via `AppState` object.
- Manual state machine enforcing the progression: `INITIAL` -> `ENCODED` -> `INJECTED` -> `DETECTED` -> `CORRECTED` -> `VERIFIED`.
- Event listeners ensure that detection and correction NEVER execute automatically.

**style.css**
- CSS custom properties (variables) for the professional academic laboratory theme.
- Responsive design preventing horizontal overflow issues.
- Detailed visual styling for the 71-bit grouped visualizer components.

---

## 🎓 Course Information

- **Subject**: Computer Organization and Architecture / Computer Networks
- **Topic**: Error Detection and Correction Codes (Hamming SEC)

---

## 📜 License

MIT License - Feel free to use and modify for educational purposes.

---

## 💡 Notes

This is an educational project designed to teach Hamming Code concepts through an interactive, manually-stepped simulation. All processing happens client-side with no backend or external dependencies required. 
&copy; 2026 Hamming Code Interactive Laboratory
