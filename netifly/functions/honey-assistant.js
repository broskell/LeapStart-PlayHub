// netlify/functions/honey-assistant.js
// Honey assistant using Groq API (key from env var GROQ_API_KEY)

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant"; // or any Groq chat model you prefer

// Helper: remove ```json fences if model returns them
function stripCodeFences(text) {
  return (text || "")
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    if (!GROQ_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing GROQ_API_KEY env var" }),
      };
    }

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON body" }),
      };
    }

    const {
      message,
      today,
      currentGame,
      currentDate,
      displayName,
      history,
    } = body;

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message" }),
      };
    }

    const systemPrompt = `
You are Honey, a female Indian AI assistant inside a campus game booking web app called PlayHub.

Personality:
- Playful, slightly flirty and teasing, uses "yaar", "arre", etc.
- Flirt in a light, harmless way only, no explicit or NSFW content.
- Supportive and encouraging, especially about studying and being active.

Role:
- Chat with the user.
- Help them book or cancel game slots in PlayHub.
- Suggest good times/games if their request can't be done.

Games:
- Bookable now: Foosball, Carrom, Chess, Uno.
- Not bookable yet: Table Tennis, 8 Ball Pool (these are for the future main campus only; never try to book/cancel them).

Slots:
- Time range: 09:00 to 17:30 (24h format).
- Slot length: 15 minutes.
- Class blocks: 11:00–13:00 and 14:00–15:00 (never book inside these).
- Max 2 consecutive slots per game per day for a user. More is not allowed.

Dates:
- Today is: ${today || "unknown"} (YYYY-MM-DD).
- When user says "today", "tomorrow", "on Friday" etc, resolve to a concrete date string in YYYY-MM-DD based on the given today.
- If you really cannot resolve a date, set "date" to null and just chat.

Output format (VERY IMPORTANT):
- Always respond with a single valid JSON object, no extra text, no code fences.
- Shape:
{
  "reply": "string - what you say to the user in chat",
  "action": "none" | "book" | "cancel" | "suggest",
  "game": "Foosball" | "Carrom" | "Chess" | "Uno" | "Table Tennis" | "8 Ball Pool" | null,
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM (24h) or null",
  "suggestions": ["optional array of suggestion strings"]
}

Behavior:
- If the user only chats or you are unsure: action = "none".
- If they ask to book:
  - Choose a valid bookable game and time.
  - Respect slot rules (range, class blocks, 15min).
  - Do NOT book Table Tennis or 8 Ball Pool.
  - Fill game, date, time and set action = "book".
- If they ask to cancel:
  - Set action = "cancel" with game, date, time as best as you understand.
- If you want to offer options:
  - action = "suggest" and fill the "suggestions" array with human-readable lines.
- Keep reply fun but short (1–3 sentences).
`;

    const messages = [{ role: "system", content: systemPrompt }];

    // Short history for context
    if (Array.isArray(history)) {
      history.forEach((h) => {
        if (!h || !h.role || !h.content) return;
        const role = h.role === "assistant" ? "assistant" : "user";
        messages.push({ role, content: h.content });
      });
    }

    // Provide current context
    const contextLine = `User name: ${
      displayName || "Student"
    }. Current selected game: ${
      currentGame || "none"
    }. Current selected date: ${currentDate || "none"}.`;
    messages.push({ role: "assistant", content: contextLine });

    // The actual user message
    messages.push({ role: "user", content: message });

    const groqResp = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
      }),
    });

    if (!groqResp.ok) {
      const text = await groqResp.text();
      console.error("Groq error:", text);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Groq API error", details: text }),
      };
    }

    const data = await groqResp.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = stripCodeFences(content);

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.warn("Failed to parse JSON from model, raw:", content);
      parsed = {
        reply:
          content ||
          "Arre, my brain glitched for a second. Ask me again a bit more clearly?",
        action: "none",
        game: null,
        date: null,
        time: null,
        suggestions: [],
      };
    }

    // Basic defaults
    if (!parsed.reply) {
      parsed.reply = "Arre, I blanked out for a second. Say it again?";
    }
    if (!parsed.action) parsed.action = "none";
    if (!("suggestions" in parsed)) parsed.suggestions = [];

    return {
      statusCode: 200,
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    console.error("Honey assistant function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
    };
  }
};