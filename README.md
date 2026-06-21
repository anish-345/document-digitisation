# 📄 Sheetify - Intelligent Document Digitization

[![Live Demo on Vercel](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://document-digitisationn.vercel.app/)

### 🔗 **[CLICK HERE TO VIEW LIVE PROJECT ON VERCEL](https://document-digitisationn.vercel.app/)** 🔗

> **A Next-Generation Optical Character Recognition (OCR) and Intelligent Document Processing (IDP) platform built for speed, accuracy, and ease of use.**

---

## 🎯 The Problem
Businesses, students, and professionals spend countless hours manually typing data from physical documents, scanned invoices, handwritten notes, and complex tables into spreadsheets. Traditional OCR tools are rigid, fail on messy handwriting, and cannot intelligently structure tabular data.

## 💡 Our Solution: Sheetify
Sheetify leverages state-of-the-art multimodal Large Language Models (LLMs) to instantly digitize any document. Simply upload a picture of a receipt, a handwritten letter, or a multi-page financial report, and Sheetify will instantly convert it into perfectly structured tabular data or precisely transcribed text.

### ✨ Key Features Built for the Hackathon:
- **📊 Smart Tabular Extraction**: Upload an image of a table or invoice, and the AI will perfectly reconstruct it into an editable, interactive data grid.
- **✍️ Handwritten Text Transcription**: A dedicated OCR mode that transcribes messy handwritten letters and notes with extreme precision, preserving original paragraphs and formatting.
- **🔄 Multi-Document Synthesis**: Upload multiple pages of a single document, and the AI will merge them into a single, cohesive dataset.
- **🌍 Multilingual Processing**: Detects and translates foreign document headers to English while preserving the original localized data.
- **💾 Enterprise Exports**: One-click exports to **Excel (.xlsx)**, **CSV**, and **JSON**.
- **🛡️ Intelligent AI Fallback Loop**: We engineered a robust backend that automatically cycles through 9 different Google Gemini models (`2.0-flash`, `1.5-pro`, `1.5-flash`, etc.) in real-time to bypass rate limits and ensure 100% uptime.

---

## 🛠️ Tech Stack & Architecture
- **Frontend UI**: React 18, Vite, Tailwind CSS, Framer Motion (for buttery smooth micro-animations).
- **Backend Infrastructure**: Serverless API routes deployed on Vercel edge network.
- **AI Engine**: Google Gemini Multimodal Vision APIs (`@google/genai`).
- **Data Handling**: ExcelJS (for high-fidelity spreadsheet generation), Recharts (for data visualization).

## 🚀 How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/anish-345/document-digitisation.git
   cd document-digitisation
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Google Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
5. **Open your browser** at `http://localhost:5173` and start digitizing!

---
*Built with ❤️ for the 24-Hour Hackathon.*
