import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Gemini Chat Proxy
  app.post("/api/chat", async (req, res) => {
    const { messages, text, language } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `
        You are the official AI Concierge for PLANTRIPGO, a luxury AI Travel Planner.
        Your tone: Professional, sophisticated, helpful, and slightly "artisan".
        
        Website Context:
        - PLANTRIPGO creates bespoke 7-day itineraries (default) using AI.
        - Features: "Artisan Logic" (cultural depth), "Minimal Transit" (efficient routes), "Heritage Export" (beautiful PDFs).
        - Creator: PHI LEGEND.
        - Answer in ${language === 'vi' ? 'Vietnamese' : 'English'}.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          })),
          { role: 'user', parts: [{ text }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "AI failed to respond", details: error.message });
    }
  });

  // Simple in-memory cache for geocoding
  const geocodeCache = new Map<string, any>();

  // Geocoding Proxy with cache and retry
  app.get("/api/geocode", async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    // Check cache first
    if (geocodeCache.has(q)) {
      return res.json(geocodeCache.get(q));
    }

    const fetchWithRetry = async (query: string, retries = 3, delay = 1000): Promise<any> => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
          {
            headers: {
              "User-Agent": "PlanTripGo/1.1 (phiduutdeet@gmail.com)",
              "Accept-Language": "en",
            },
          }
        );

        if (response.status === 429 && retries > 0) {
          console.log(`429 encountered for "${query}", retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(query, retries - 1, delay * 2);
        }

        if (!response.ok) {
          throw new Error(`Nominatim error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(query, retries - 1, delay * 2);
        }
        throw error;
      }
    };

    try {
      const data = await fetchWithRetry(q);
      // Cache the result
      geocodeCache.set(q, data);
      res.json(data);
    } catch (error: any) {
      console.error("Geocoding proxy error:", error);
      res.status(500).json({ error: "Failed to fetch geocoding data", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
