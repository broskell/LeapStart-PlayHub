// playhub.js – Firestore multi-user, challenges, new games
// Games: Foosball, Carrom, Chess, Uno = bookable
// Table Tennis, 8-Ball Pool = disabled ("future main campus")

// -----------------------------------------------------------------------------
// CONFIG
// -----------------------------------------------------------------------------
const BOOKABLE_GAMES = ["Foosball", "Carrom", "Chess", "Uno"];
const DISABLED_GAMES = ["Table Tennis", "8 Ball Pool"];

const SLOT_START_HOUR = 9;        // 9:00
const SLOT_END_HOUR = 17.5;       // 17:30
const SLOT_MINUTES_STEP = 15;     // 15-minute slots

// Time ranges (minutes from midnight) that must NOT appear / be bookable
const CLASS_BLOCKS = [
  { start: 11 * 60, end: 13 * 60 }, // 11:00 – 13:00
  { start: 14 * 60, end: 15 * 60 }, // 14:00 – 15:00
];

// -----------------------------------------------------------------------------
// DOM
// -----------------------------------------------------------------------------
const logoutBtn = document.getElementById("logout-btn");
const userNameEl = document.getElementById("user-name");
const userAvatarEl = document.getElementById("user-avatar");

const gameCards = document.querySelectorAll(".game-card");
const dateInput = document.getElementById("date-input");
const selectedGameLabel = document.getElementById("selected-game-label");
const selectedDateLabel = document.getElementById("selected-date-label");
const slotGrid = document.getElementById("slot-grid");

const bookingForm = document.getElementById("booking-form");
const nameInput = document.getElementById("student-name");
const gameSelect = document.getElementById("game-select");
const slotSelect = document.getElementById("slot-select");
const slotHint = document.getElementById("slot-hint");
const formMessage = document.getElementById("form-message");

const myBookingsList = document.getElementById("my-bookings-list");
const challengeList = document.getElementById("challenge-list");

// -----------------------------------------------------------------------------
// STATE
// -----------------------------------------------------------------------------
let currentUser = null;
let selectedGame = "Foosball";
let ALL_SLOTS = [];
let dayBookings = [];        // bookings for selected game/date
let myBookings = [];         // bookings for logged in user
let incomingChallenges = []; // challenges for logged in user

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
function timeStringToMinutes(label) {
  const [h, m] = label.split(":").map(Number);
  return h * 60 + m;
}

function isBlockedTime(slotLabel) {
  const minutes = timeStringToMinutes(slotLabel);
  return CLASS_BLOCKS.some(
    (block) => minutes >= block.start && minutes < block.end
  );
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

    if (!isBlockedTime(label)) {
      slots.push(label);
    }
    time += SLOT_MINUTES_STEP;
  }
  return slots;
}

function populateSlotSelect() {
  slotSelect.innerHTML = "";
  ALL_SLOTS.forEach((slot) => {
    const opt = document.createElement("option");
    opt.value = slot;
    opt.textContent = slot;
    slotSelect.appendChild(opt);
  });
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

function getSelectedDate() {
  return dateInput.value;
}

// Create a unique doc ID for each game/date/slot
function makeSlotId(game, date, slot) {
  return `${date}_${game}_${slot.replace(":", "-")}`;
}

// -----------------------------------------------------------------------------
// RENDERING
// -----------------------------------------------------------------------------
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
        bookingForm.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } else {
      card.classList.add("booked");
      statusEl.textContent = `Booked by ${booking.displayName || "student"}`;

      if (booking.uid === currentUser?.uid) {
        card.classList.add("mine");
      } else {
        const challengeBtn = document.createElement("button");
        challengeBtn.textContent = "Challenge";
        challengeBtn.className = "secondary-btn small";
        challengeBtn.style.marginTop = "4px";
        challengeBtn.addEventListener("click", () => {
          createChallenge(booking);
        });
        card.appendChild(challengeBtn);
      }
    }

    card.appendChild(timeEl);
    card.appendChild(statusEl);
    slotGrid.appendChild(card);
  });
}

function renderMyBookings() {
  myBookingsList.innerHTML = "";
  if (!myBookings.length) {
    const li = document.createElement("li");
    li.textContent = "No bookings yet.";
    li.style.fontSize = "12px";
    li.style.color = "#9ca3af";
    myBookingsList.appendChild(li);
    return;
  }

  myBookings
    .slice()
    .sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot))
    .forEach((b) => {
      const li = document.createElement("li");
      li.className = "my-bookings-item";
      const info = document.createElement("div");
      info.innerHTML = `<strong>${b.game}</strong> · ${b.date} · ${b.slot}`;
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "secondary-btn small";
      cancelBtn.textContent = "Cancel";
      cancelBtn.onclick = async () => {
        await db.collection("bookings").doc(b.id).delete();
        await loadMyBookings();
        await loadDayBookings();
      };
      li.appendChild(info);
      li.appendChild(cancelBtn);
      myBookingsList.appendChild(li);
    });
}

function renderChallenges() {
  challengeList.innerHTML = "";
  if (!incomingChallenges.length) {
    const li = document.createElement("li");
    li.textContent = "No challenges yet.";
    li.style.fontSize = "12px";
    li.style.color = "#9ca3af";
    challengeList.appendChild(li);
    return;
  }

  incomingChallenges
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .forEach((c) => {
      const li = document.createElement("li");
      li.className = "challenge-item";

      const info = document.createElement("div");
      info.innerHTML = `<strong>${c.fromName || "Someone"}</strong> challenged you for <strong>${c.game}</strong> · ${c.date} · ${c.slot}<br><span class="challenge-status">Status: ${c.status}</span>`;

      const actions = document.createElement("div");
      actions.className = "challenge-actions";

      if (c.status === "pending") {
        const acceptBtn = document.createElement("button");
        acceptBtn.className = "primary-btn";
        acceptBtn.textContent = "Accept";
        acceptBtn.onclick = () => updateChallengeStatus(c.id, "accepted");

        const declineBtn = document.createElement("button");
        declineBtn.className = "secondary-btn";
        declineBtn.textContent = "Decline";
        declineBtn.onclick = () => updateChallengeStatus(c.id, "declined");

        actions.appendChild(acceptBtn);
        actions.appendChild(declineBtn);
      } else {
        const statusBadge = document.createElement("span");
        statusBadge.className = "badge";
        statusBadge.textContent =
          c.status === "accepted" ? "Accepted" : "Declined";
        actions.appendChild(statusBadge);
      }

      li.appendChild(info);
      li.appendChild(actions);
      challengeList.appendChild(li);
    });
}

// -----------------------------------------------------------------------------
// LOAD FROM FIRESTORE
// -----------------------------------------------------------------------------
async function loadDayBookings() {
  const date = getSelectedDate();
  if (!date || !currentUser) {
    dayBookings = [];
    renderSchedule();
    return;
  }

  try {
    const snap = await db
      .collection("bookings")
      .where("date", "==", date)
      .where("game", "==", selectedGame)
      .get();

    dayBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("loadDayBookings error:", err);
    dayBookings = [];
  }
  renderSchedule();
}

async function loadMyBookings() {
  if (!currentUser) {
    myBookings = [];
    renderMyBookings();
    return;
  }

  try {
    const snap = await db
      .collection("bookings")
      .where("uid", "==", currentUser.uid)
      .get();

    myBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("loadMyBookings error:", err);
    myBookings = [];
  }
  renderMyBookings();
}

async function loadChallenges() {
  if (!currentUser) {
    incomingChallenges = [];
    renderChallenges();
    return;
  }

  try {
    const snap = await db
      .collection("challenges")
      .where("toUid", "==", currentUser.uid)
      .get();

    incomingChallenges = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("loadChallenges error:", err);
    incomingChallenges = [];
  }
  renderChallenges();
}

// -----------------------------------------------------------------------------
// ACTIONS  (max 2 consecutive slots per game/date/user)
// -----------------------------------------------------------------------------
async function bookSlot(game, date, slot, displayNameFromForm) {
  if (!currentUser) return;

  if (!BOOKABLE_GAMES.includes(game)) {
    throw new Error(
      "This game is not bookable yet. It will be available in a future main campus version."
    );
  }

  if (isBlockedTime(slot)) {
    throw new Error("This time cannot be booked.");
  }

  const bookingsRef = db.collection("bookings");
  const slotId = makeSlotId(game, date, slot);
  const docRef = bookingsRef.doc(slotId);

  // 1) check if this slot is already booked
  const existing = await docRef.get();
  if (existing.exists) {
    throw new Error("Slot already booked");
  }

  // 2) get this user's bookings for same game + date
  const mySnap = await bookingsRef
    .where("uid", "==", currentUser.uid)
    .where("game", "==", game)
    .where("date", "==", date)
    .get();

  const userSlots = mySnap.docs.map((d) => d.data().slot);
  userSlots.push(slot);

  // sort & enforce "no more than 2 consecutive"
  userSlots.sort((a, b) => timeStringToMinutes(a) - timeStringToMinutes(b));
  const step = SLOT_MINUTES_STEP;

  for (let i = 0; i <= userSlots.length - 3; i++) {
    const t1 = timeStringToMinutes(userSlots[i]);
    const t2 = timeStringToMinutes(userSlots[i + 1]);
    const t3 = timeStringToMinutes(userSlots[i + 2]);
    if (t2 === t1 + step && t3 === t2 + step) {
      throw new Error(
        "You can book at most 2 back‑to‑back slots. Leave a gap before booking more."
      );
    }
  }

  // 3) create booking – only simple types
  await docRef.set({
    uid: currentUser.uid,
    displayName:
      currentUser.displayName || displayNameFromForm || "Student",
    game,
    date,
    slot,
    createdAt: new Date().toISOString(),
  });
}

async function createChallenge(booking) {
  if (!currentUser) return;
  if (booking.uid === currentUser.uid) return;

  await db.collection("challenges").add({
    fromUid: currentUser.uid,
    fromName: currentUser.displayName || "Student",
    toUid: booking.uid,
    toName: booking.displayName || "Student",
    game: booking.game,
    date: booking.date,
    slot: booking.slot,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  alert(`Challenge sent to ${booking.displayName || "the player"}`);
}

async function updateChallengeStatus(id, status) {
  await db.collection("challenges").doc(id).update({ status });
  await loadChallenges();
}

// -----------------------------------------------------------------------------
// AUTH + INIT
// -----------------------------------------------------------------------------
logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "index.html"; // or login.html if you kept that name
});

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html"; // or login.html
    return;
  }

  currentUser = user;
  userNameEl.textContent = user.displayName || "Student";
  if (user.photoURL) {
    userAvatarEl.src = user.photoURL;
  } else {
    userAvatarEl.src =
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(user.displayName || "S");
  }

  await db
    .collection("users")
    .doc(user.uid)
    .set(
      {
        displayName: user.displayName || null,
        email: user.email || null,
        photoURL: user.photoURL || null,
        lastLoginAt: new Date().toISOString(),
      },
      { merge: true }
    );

  await loadMyBookings();
  await loadDayBookings();
  await loadChallenges();
});

// -----------------------------------------------------------------------------
// UI EVENTS
// -----------------------------------------------------------------------------
gameCards.forEach((card) => {
  const gameName = card.dataset.game;
  const isDisabled = card.dataset.disabled === "true";

  card.addEventListener("click", async () => {
    if (isDisabled || DISABLED_GAMES.includes(gameName)) {
      alert(
        `${gameName} bookings will be available in a future version when we shift to the main campus.`
      );
      return;
    }

    gameCards.forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
    selectedGame = gameName;
    gameSelect.value = selectedGame;
    await loadDayBookings();
  });
});

dateInput.addEventListener("change", async () => {
  await loadDayBookings();
});

bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMessage.style.color = "#ef4444";
  formMessage.textContent = "";

  if (!currentUser) {
    formMessage.textContent = "Please log in first.";
    return;
  }

  const name = nameInput.value.trim();
  const game = gameSelect.value;
  const date = getSelectedDate();
  const slot = slotSelect.value;

  if (!name || !date || !slot) {
    formMessage.textContent = "Please fill in all required fields.";
    return;
  }

  if (!BOOKABLE_GAMES.includes(game)) {
    formMessage.textContent =
      "This game is not bookable yet. It will be available when we shift to the main campus.";
    return;
  }

  // Sync displayName
  if (currentUser.displayName !== name) {
    try {
      await currentUser.updateProfile({ displayName: name });
      await db.collection("users").doc(currentUser.uid).set(
        { displayName: name },
        { merge: true }
      );
    } catch (err) {
      console.warn("Failed to update displayName:", err);
    }
  }

  try {
    await bookSlot(game, date, slot, name);
    formMessage.style.color = "#22c55e";
    formMessage.textContent = "Slot booked successfully!";
    await loadMyBookings();
    await loadDayBookings();
    setTimeout(() => (formMessage.textContent = ""), 2500);
  } catch (err) {
    console.error("Booking error:", err);
    formMessage.textContent = err.message || "Booking failed.";
  }
});

// -----------------------------------------------------------------------------
// INITIAL UI SETUP (before login)
// -----------------------------------------------------------------------------
ALL_SLOTS = generateSlots();
populateSlotSelect();
const today = new Date().toISOString().slice(0, 10);
dateInput.value = today;
selectedGame = "Foosball";
gameSelect.value = selectedGame;
selectedGameLabel.textContent = selectedGame;
selectedDateLabel.textContent = formatDateForDisplay(today);

renderSchedule();
renderMyBookings();
renderChallenges();