# CodeAlpha_LanguageTranslationTool

**WordBridge** – a full-stack language translation web app, built for the **CodeAlpha AI Internship (Task 1)**.

## Features
- 30+ languages including Hindi, Telugu and Tamil
- Auto-detect source language, swap languages, language search
- Long text support (up to 5000 characters)
- Listen (text-to-speech), Copy, dark and light mode

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Translation: Google translate endpoint with MyMemory as automatic backup (no API key needed)

## How It Works
1. The user enters text and selects languages in the browser.
2. The frontend sends it to the backend: `POST /api/translate`.
3. The backend validates the input, splits long text, calls the translation engine and returns the result.
4. The translated text is shown on screen.

## API
- `GET /api/languages` – supported languages
- `POST /api/translate` – body: `{ "text": "...", "from": "auto", "to": "es" }`
- `GET /api/health` – server status

## Run Locally
npm install

npm start

Open http://localhost:3000

## Live Demo

https://codealpha-languagetranslationtool-asme.onrender.com

## Video Demo Link

https://drive.google.com/file/d/1PTzeBbUKbcUeyXJNWlYSUJoPAwaTfSpI/view?usp=drivesdk

## Author
Omprashanth Reddy – CodeAlpha AI Intern
