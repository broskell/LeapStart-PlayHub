// ============================================================================
// HONEY FLOATING WIDGET + AI ASSISTANT
// ============================================================================

// DOM references for Honey
const honeyToggleBtn   = document.getElementById("honey-toggle");
const honeyWidget      = document.getElementById("honey-widget");
const honeyCloseBtn    = document.getElementById("honey-close");
const honeyChatForm    = document.getElementById("honey-chat-form");
const honeyInput       = document.getElementById("honey-input");
const honeyMessages    = document.getElementById("honey-chat-messages");

// Optional typing indicator (if you added <div id="honey-typing" ...>)
const honeyTyping      = document.getElementById("honey-typing");

let honeyHistory = []; // {role:'user'|'assistant', content}

// --- UI helpers ---

function addHoneyMessage(role, text) {
  if (!honeyMessages) return;
  const div = document.createElement("div");
  div.className = "honey-msg " + role;
  div.textContent = text;
  honeyMessages.appendChild(div);
  honeyMessages.scrollTop = honeyMessages.scrollHeight;
}

function pushHoneyHistory(role, content) {
  honeyHistory.push({ role, content });
  if (honeyHistory.length > 20) {
    honeyHistory = honeyHistory.slice(-20);
  }
}
// --- Typing indicator helpers ---
function showHoneyTyping() {
  if (!honeyTyping) return;
  honeyTyping.style.display = "flex";
}
function hideHoneyTyping() {
  if (!honeyTyping) return;
  honeyTyping.style.display = "none";
}

// --- Handle actions returned by Honey (book / cancel / suggest) ---

async function handleHoneyAction(obj) {
  if (!obj || !obj.action) return;

  const name =
    nameInput?.value.trim() ||
    currentUser?.displayName ||
    "Student";

  if (obj.action === "book") {
    const { game, date, time } = obj;
    if (!game || !date || !time) return;

    try {
      await bookSlot(game, date, time, name);
      await loadMyBookings();
      await loadDayBookings();
      addHoneyMessage(
        "honey",
        `Done, I booked ${game} on ${date} at ${time} for you.`
      );
    } catch (err) {
      addHoneyMessage(
        "honey",
        `That booking didn’t go through: ${err.message}. Want me to try another time?`
      );
    }
  } else if (obj.action === "cancel") {
    const { game, date, time } = obj;
    if (!game || !date || !time) return;

    try {
      await cancelBookingByTriple(game, date, time);
      await loadMyBookings();
      await loadDayBookings();
      addHoneyMessage(
        "honey",
        `Okay, I cancelled your ${game} slot on ${date} at ${time}.`
      );
    } catch (err) {
      addHoneyMessage(
        "honey",
        `Couldn’t cancel that: ${err.message}.`
      );
    }
  } else if (obj.action === "suggest" && Array.isArray(obj.suggestions)) {
    addHoneyMessage(
      "honey",
      "Here are some ideas:\n- " + obj.suggestions.join("\n- ")
    );
  }
}

// --- Call Netlify function / Groq ---

async function callHoneyAssistant(userText) {
  if (!currentUser) {
    addHoneyMessage("honey", "Log in first, yaar, then I’ll help you.");
    return;
  }

  const today = new Date().toISOString().slice(0, 10);

  const body = {
    message: userText,
    today,
    currentGame: selectedGame,
    currentDate: getSelectedDate(),
    displayName:
      currentUser.displayName || nameInput?.value.trim() || "Student",
    history: honeyHistory.slice(-10),
  };

  try {
    // showHoneyTyping();
    const resp = await fetch("/.netlify/functions/honey-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    // hideHoneyTyping();

    const reply =
      data.reply || "Hmm, I got a bit confused there, yaar.";
    addHoneyMessage("honey", reply);
    pushHoneyHistory("assistant", reply);

    if (data.action && data.action !== "none") {
      await handleHoneyAction(data);
    }
  } catch (err) {
    console.error("Honey assistant error:", err);
    // hideHoneyTyping();
    addHoneyMessage(
      "honey",
      "My brain server glitched. Try again in a bit, okay?"
    );
  }
}

// --- Floating widget toggle ---

if (honeyToggleBtn && honeyWidget) {
  honeyToggleBtn.addEventListener("click", () => {
    honeyWidget.classList.add("open");
    if (honeyInput) honeyInput.focus();
  });
}

if (honeyCloseBtn && honeyWidget) {
  honeyCloseBtn.addEventListener("click", () => {
    honeyWidget.classList.remove("open");
  });
}

// --- Chat form events ---

if (honeyChatForm && honeyInput && honeyMessages) {
  honeyChatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = honeyInput.value.trim();
    if (!text) return;
    honeyInput.value = "";
    addHoneyMessage("user", text);
    pushHoneyHistory("user", text);
    await callHoneyAssistant(text);
  });

  // Initial greeting (when JS loads)
  addHoneyMessage(
    "honey",
    "Hey, I'm Honey – your slightly savage PlayHub assistant. Tap the 🍯 button if you need me."
  );
}