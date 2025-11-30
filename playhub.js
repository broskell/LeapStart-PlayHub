// ===== Firebase init =====
// Replace THIS with your firebaseConfig from the Firebase console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... copy ALL keys from your Firebase web app config
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// ===== CONFIG =====
const SLOT_START_HOUR = 9;   // 9:00
const SLOT_END_HOUR = 17.5;  // 17:30
const SLOT_MINUTES_STEP = 30;

// ===== DOM =====
const loginShell = document.getElementById("login-shell");
const appRoot = document.getElementById("app-root");

const googleLoginBtn = document.getElementById("google-login-btn");
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

// ===== STATE =====
let currentUser = null;
let selectedGame = "Foosball";
let ALL_SLOTS = [];
let dayUnsub = null;
let myBookingsUnsub = null;
let challengesUnsub = null;
let dayBookings = [];    // bookings for selected game + date
let myBookings = [];
let incomingChallenges = [];

// ===== UTILS =====
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

// ===== RENDERING =====
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

  const currentName = currentUser?.displayName || "";

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
        // Add challenge action
        const challengeLink = document.createElement("button");
        challengeLink.textContent = "Challenge";
        challengeLink.className = "secondary-btn small";
        challengeLink.style.marginTop = "4px";
        challengeLink.addEventListener("click", () => {
          createChallenge(booking);
        });
        card.appendChild(challengeLink);
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
    .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
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

// ===== FIRESTORE LISTENERS =====
function listenToDayBookings() {
  const date = getSelectedDate();
  if (dayUnsub) dayUnsub();
  if (!date || !currentUser) {
    dayBookings = [];
    renderSchedule();
    return;
  }

  dayUnsub = db
    .collection("bookings")
    .where("date", "==", date)
    .where("game", "==", selectedGame)
    .onSnapshot((snap) => {
      dayBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderSchedule();
    });
}

function listenToMyBookings() {
  if (myBookingsUnsub) myBookingsUnsub();
  if (!currentUser) {
    myBookings = [];
    renderMyBookings();
    return;
  }

  myBookingsUnsub = db
    .collection("bookings")
    .where("uid", "==", currentUser.uid)
    .onSnapshot((snap) => {
      myBookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderMyBookings();
      listenToDayBookings(); // update mine highlight
    });
}

function listenToChallenges() {
  if (challengesUnsub) challengesUnsub();
  if (!currentUser) {
    incomingChallenges = [];
    renderChallenges();
    return;
  }

  challengesUnsub = db
    .collection("challenges")
    .where("toUid", "==", currentUser.uid)
    .onSnapshot((snap) => {
      incomingChallenges = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderChallenges();
    });
}

// ===== ACTIONS =====
async function bookSlot(game, date, slot) {
  if (!currentUser) return;
  const bookingsRef = db.collection("bookings");

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(
      bookingsRef
        .where("game", "==", game)
        .where("date", "==", date)
        .where("slot", "==", slot)
    );
    if (!existing.empty) {
      throw new Error("Slot already booked");
    }

    const docRef = bookingsRef.doc();
    tx.set(docRef, {
      uid: currentUser.uid,
      displayName: currentUser.displayName || "Student",
      game,
      date,
      slot,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  });
}

async function createChallenge(booking) {
  if (!currentUser) return;
  if (booking.uid === currentUser.uid) return;

  const challengesRef = db.collection("challenges");
  await challengesRef.add({
    fromUid: currentUser.uid,
    fromName: currentUser.displayName || "Student",
    toUid: booking.uid,
    toName: booking.displayName || "Student",
    game: booking.game,
    date: booking.date,
    slot: booking.slot,
    status: "pending",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  alert(`Challenge sent to ${booking.displayName || "the player"}`);
}

async function updateChallengeStatus(id, status) {
  await db.collection("challenges").doc(id).update({ status });
}

// ===== AUTH =====
googleLoginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (err) {
    alert("Google sign-in failed: " + err.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
});

auth.onAuthStateChanged(async (user) => {
  currentUser = user || null;

  if (user) {
    loginShell.classList.add("hidden");
    appRoot.classList.remove("hidden");

    userNameEl.textContent = user.displayName || "Student";
    if (user.photoURL) {
      userAvatarEl.src = user.photoURL;
    } else {
      userAvatarEl.src =
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(user.displayName || "S");
    }

    // Ensure user doc exists
    await db
      .collection("users")
      .doc(user.uid)
      .set(
        {
          displayName: user.displayName || null,
          email: user.email || null,
          photoURL: user.photoURL || null,
          lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    listenToMyBookings();
    listenToChallenges();
    listenToDayBookings();
  } else {
    loginShell.classList.remove("hidden");
    appRoot.classList.add("hidden");
    if (dayUnsub) dayUnsub();
    if (myBookingsUnsub) myBookingsUnsub();
    if (challengesUnsub) challengesUnsub();
  }
});

// ===== UI EVENTS =====
gameCards.forEach((card) => {
  card.addEventListener("click", () => {
    gameCards.forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
    selectedGame = card.dataset.game;
    gameSelect.value = selectedGame;
    listenToDayBookings();
  });
});

dateInput.addEventListener("change", () => {
  listenToDayBookings();
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

  // Sync display name with auth user for better consistency
  if (currentUser.displayName !== name) {
    await currentUser.updateProfile({ displayName: name });
    await db.collection("users").doc(currentUser.uid).set(
      {
        displayName: name,
      },
      { merge: true }
    );
  }

  try {
    await bookSlot(game, date, slot);
    formMessage.style.color = "#22c55e";
    formMessage.textContent = "Slot booked successfully!";
    setTimeout(() => {
      formMessage.textContent = "";
    }, 2500);
  } catch (err) {
    formMessage.textContent = err.message || "Booking failed.";
  }
});

// ===== INIT =====
function init() {
  ALL_SLOTS = generateSlots();
  populateSlotSelect();

  const today = new Date().toISOString().slice(0, 10);
  dateInput.value = today;

  selectedGame = "Foosball";
  gameSelect.value = selectedGame;

  selectedGameLabel.textContent = selectedGame;
  selectedDateLabel.textContent = formatDateForDisplay(today);
}

init();