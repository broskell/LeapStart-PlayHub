// ===== CONFIG =====
const SPORTS = ["Foosball", "Carrom", "Table Tennis"];
const SLOT_START_HOUR = 9;   // 9:00
const SLOT_END_HOUR = 17.5;  // 17:30
const SLOT_MINUTES_STEP = 30;

// ===== DOM ELEMENTS =====
const nameInput = document.getElementById("student-name");
const idInput = document.getElementById("student-id");
const gameSelect = document.getElementById("game-select");
const dateInput = document.getElementById("date-input");
const slotSelect = document.getElementById("slot-select");
const bookingForm = document.getElementById("booking-form");
const formMessage = document.getElementById("form-message");
const myBookingsList = document.getElementById("my-bookings-list");
const slotHint = document.getElementById("slot-hint");

const gameCards = document.querySelectorAll(".game-card");
const selectedGameLabel = document.getElementById("selected-game-label");
const selectedDateLabel = document.getElementById("selected-date-label");
const slotGrid = document.getElementById("slot-grid");

// ===== STATE =====
let bookings = []; // { id, name, studentId, game, date (YYYY-MM-DD), slot }
let selectedGame = "Foosball";

// ===== HELPERS =====
function saveBookings() {
  localStorage.setItem("leapstartBookings", JSON.stringify(bookings));
}

function loadBookings() {
  try {
    const raw = localStorage.getItem("leapstartBookings");
    bookings = raw ? JSON.parse(raw) : [];
  } catch {
    bookings = [];
  }
}

function generateSlots() {
  const slots = [];
  let time = SLOT_START_HOUR * 60;
  const endTime = SLOT_END_HOUR * 60;

  while (time <= endTime) {
    const h = Math.floor(time / 60);
    const m = time % 60;
    const label =
      String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
    slots.push(label);
    time += SLOT_MINUTES_STEP;
  }
  return slots;
}

const ALL_SLOTS = generateSlots();

function populateSlotSelect() {
  slotSelect.innerHTML = "";
  ALL_SLOTS.forEach((slot) => {
    const opt = document.createElement("option");
    opt.value = slot;
    opt.textContent = slot;
    slotSelect.appendChild(opt);
  });
}

function getSelectedDate() {
  return dateInput.value;
}

function formatDateForDisplay(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ===== RENDERING =====
function renderMyBookings() {
  myBookingsList.innerHTML = "";
  if (!bookings.length) {
    const li = document.createElement("li");
    li.textContent = "No bookings yet.";
    li.style.color = "#9ca3af";
    li.style.fontSize = "12px";
    myBookingsList.appendChild(li);
    return;
  }

  bookings
    .slice()
    .sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot))
    .forEach((b) => {
      const li = document.createElement("li");
      li.className = "my-bookings-item";

      const info = document.createElement("div");
      info.innerHTML = `<strong>${b.game}</strong> · ${b.date} · ${b.slot}<br><span class="badge">${b.name || "Anonymous"}</span>`;

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "cancel-btn";
      cancelBtn.textContent = "Cancel";
      cancelBtn.onclick = () => {
        bookings = bookings.filter((x) => x.id !== b.id);
        saveBookings();
        renderMyBookings();
        renderSchedule();
      };

      li.appendChild(info);
      li.appendChild(cancelBtn);
      myBookingsList.appendChild(li);
    });
}

function renderSchedule() {
  const date = getSelectedDate();
  selectedGameLabel.textContent = selectedGame;
  selectedDateLabel.textContent = date
    ? formatDateForDisplay(date)
    : "Select a date";

  slotGrid.innerHTML = "";
  if (!date) {
    const msg = document.createElement("div");
    msg.className = "hint";
    msg.textContent = "Pick a date above to view the schedule.";
    slotGrid.appendChild(msg);
    return;
  }

  const dayBookings = bookings.filter(
    (b) => b.date === date && b.game === selectedGame
  );

  const currentName = nameInput.value.trim();
  const currentId = idInput.value.trim();

  ALL_SLOTS.forEach((slot) => {
    const card = document.createElement("div");
    card.className = "slot-card";

    const timeEl = document.createElement("div");
    timeEl.className = "slot-time";
    timeEl.textContent = slot;

    const statusEl = document.createElement("div");
    statusEl.className = "slot-status";

    const booking = dayBookings.find((b) => b.slot === slot);

    if (!booking) {
      card.classList.add("available");
      statusEl.textContent = "Available";
      card.addEventListener("click", () => {
        slotSelect.value = slot;
        slotHint.textContent = `Selected: ${slot} for ${selectedGame}`;
        slotHint.style.color = "#facc15";
        setTimeout(() => {
          slotHint.textContent =
            "Tip: click a slot on the left to auto‑select it.";
          slotHint.style.color = "#9ca3af";
        }, 2500);
        // Smooth scroll to booking form on small screens
        bookingForm.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } else {
      card.classList.add("booked");
      statusEl.textContent = `Booked by ${booking.name || "student"}`;
    }

    // Highlight if it's "my" booking (same name & id)
    if (
      booking &&
      currentName &&
      booking.name === currentName &&
      booking.studentId === currentId
    ) {
      card.classList.add("mine");
    }

    card.appendChild(timeEl);
    card.appendChild(statusEl);
    slotGrid.appendChild(card);
  });
}

// ===== EVENT HANDLERS =====
bookingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  formMessage.style.color = "#ef4444";
  formMessage.textContent = "";

  const name = nameInput.value.trim();
  const studentId = idInput.value.trim();
  const game = gameSelect.value;
  const date = getSelectedDate();
  const slot = slotSelect.value;

  if (!name || !date || !slot) {
    formMessage.textContent = "Please fill in name, date and slot.";
    return;
  }

  const exists = bookings.some(
    (b) => b.game === game && b.date === date && b.slot === slot
  );
  if (exists) {
    formMessage.textContent =
      "That slot is already booked for this game. Please choose another.";
    return;
  }

  const booking = {
    id: Date.now().toString(),
    name,
    studentId,
    game,
    date,
    slot,
  };

  bookings.push(booking);
  saveBookings();
  renderMyBookings();
  renderSchedule();

  formMessage.style.color = "#22c55e";
  formMessage.textContent = "Slot booked successfully!";
  setTimeout(() => {
    formMessage.textContent = "";
  }, 2500);
});

gameCards.forEach((card) => {
  card.addEventListener("click", () => {
    gameCards.forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
    selectedGame = card.dataset.game;
    gameSelect.value = selectedGame;
    renderSchedule();
  });
});

dateInput.addEventListener("change", () => {
  renderSchedule();
});

// ===== INIT =====
function init() {
  populateSlotSelect();
  loadBookings();

  const today = new Date().toISOString().slice(0, 10);
  dateInput.value = today;

  selectedGame = "Foosball";
  gameSelect.value = selectedGame;

  renderMyBookings();
  renderSchedule();
}

init();