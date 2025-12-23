/* =========================================================
   GiftWhisperer – Main App Logic
   Frontend ONLY (No API keys here)
   Talks to /api/groq (Vercel serverless)
========================================================= */

/* ================= AUTH GUARD ================= */
const user = localStorage.getItem("giftwhisperer_user");
if (!user) {
  window.location.href = "/index.html";
}

/* ================= DOM ================= */
const chatBox = document.getElementById("chat");
const input = document.getElementById("userInput");

/* ================= STATE ================= */
let step = 1;
const giftData = {};

/* ================= INIT ================= */
addBot(
  "Hi 👋 I’m <b>GiftWhisperer</b> 🎁<br><br>" +
  "I’ll help you find the perfect gift.<br><br>" +
  "<b>Step 1:</b> What is the recipient’s gender?<br>" +
  "(Male / Female / Other)"
);

/* ================= INPUT HANDLER ================= */
window.handleUserInput = async () => {
  const text = input.value.trim();
  if (!text) return;

  addUser(text);
  input.value = "";

  switch (step) {
    case 1: {
      const g = text.toLowerCase();
      if (!["male", "female", "other"].includes(g)) {
        addBot("❌ Please choose: <b>Male</b>, <b>Female</b>, or <b>Other</b>.");
        return;
      }
      giftData.gender = capitalize(text);
      step++;
      addBot("<b>Step 2:</b> What is your budget in ₹? (Minimum ₹100)");
      break;
    }

    case 2: {
      const match = text.match(/\d+/);
      if (!match || parseInt(match[0], 10) < 100) {
        addBot("❌ Please enter a valid amount (₹100 or more).");
        return;
      }
      giftData.amount = match[0];
      step++;
      addBot("<b>Step 3:</b> Tell me a little about the person.");
      break;
    }

    case 3:
      giftData.about = text;
      step++;
      addBot("<b>Step 4:</b> Occasion? (One word, max 15 characters)");
      break;

    case 4:
      if (text.length > 15) {
        addBot("❌ Please keep the occasion within 15 characters.");
        return;
      }
      giftData.occasion = capitalize(text);
      step++;
      addBot("<b>Step 5:</b> What is your relationship with them?");
      break;

    case 5:
      giftData.relationship = capitalize(text);
      step++;
      addBot("✨ Thinking of thoughtful gift ideas…");
      await fetchGiftSuggestions();
      break;

    default:
      addBot("🎁 Want another recommendation? Refresh the page.");
  }
};

/* ================= GROQ PROXY CALL ================= */
async function fetchGiftSuggestions() {
  try {
    const res = await fetch("/api/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "gift",
        data: giftData,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Server error");
    }

    const json = await res.json();

    if (!json.success) {
      throw new Error(json.error || "AI error");
    }

    addBot(formatGiftResponse(json.answer));
  } catch (err) {
    console.error("Groq fetch failed:", err);
    addBot("❌ Sorry, something went wrong. Please try again.");
  }
}

/* ================= UI HELPERS ================= */
function markdownToHTML(text) {
  return text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}


function addBot(message) {
  chatBox.innerHTML += `<div class="bot">${markdownToHTML(message)}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addUser(message) {
  chatBox.innerHTML += `<div class="user">${escapeHTML(message)}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHTML(text) {
  return text.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function formatGiftResponse(text) {
  // Basic formatting for numbered lists
  return text
    .replace(/\n/g, "<br>")
    .replace(/(\d+\.)/g, "<br><b>$1</b>");
}
