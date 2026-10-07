/* Acharyaa Ankush — site behaviour
   Everything that changes often (prices, products, reviews, FAQs) lives in
   /data/*.json. This file only renders it — edit the JSON, not this file. */

const CONFIG = {
  whatsapp: "918527527699", // country code + number, no + or spaces
  phoneDisplay: "+91 85275 27699",
  email: "dwivediankush30@gmail.com",
  brand: "Acharyaa Ankush",
};

function waLink(message) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
}

function rupee(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

/* ---------------- Nav ---------------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );

  // Mark current page
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href").split("/").pop() || "index.html";
    if (href === path) a.setAttribute("aria-current", "page");
  });
}

/* ---------------- Scroll reveal ---------------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => io.observe(el));
}

/* ---------------- Hero chart draw-in ---------------- */
function initHeroChart() {
  const svg = document.querySelector(".kundli-svg.draw");
  if (!svg) return;
  // restart animation on load for browsers that cache animation state
  svg.style.animationPlayState = "running";
}

/* ---------------- Fetch helper ---------------- */
async function getJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("Failed to load " + path);
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

/* ---------------- Services (Consultations page) ---------------- */
function serviceCard(item, group) {
  const meta = [];
  if (item.duration) meta.push(`<span class="badge">${item.duration}</span>`);
  if (item.delivery) meta.push(`<span class="badge badge-outline">${item.delivery}</span>`);
  if (item.featured) meta.push(`<span class="badge badge-featured">Most detailed</span>`);
  const msg = `Hi ${CONFIG.brand}, I'd like to book the ${item.name} consultation (${rupee(item.price)}).`;
  return `
    <div class="card consult-card${item.featured ? " is-featured" : ""} reveal">
      <div class="consult-top">
        <div>
          <span class="card-kicker">${item.duration ? "Comprehensive" : "Focused"}</span>
          <h3>${item.name}</h3>
        </div>
        <span class="consult-price">${rupee(item.price)}</span>
      </div>
      <div class="consult-meta">${meta.join("")}</div>
      <p>${item.description}</p>
      
      <a class="btn btn-brass" href="${waLink(msg)}" target="_blank" rel="noopener">Contact for Booking</a>
      <a class="btn-ghost" style="margin-top:0.7rem; font-size:0.85rem;" href="/contact.html?service=${item.id}">Or submit full details via form</a>
    </div>`;
}

async function renderServices() {
  const focusedEl = document.querySelector("[data-services='focused']");
  const compEl = document.querySelector("[data-services='comprehensive']");
  const voiceNotesEl = document.querySelector("[data-services='voice-notes']");
const internationalEl = document.querySelector("[data-services='international']");
  const select = document.querySelector("#service-select");
  const previewEl = document.querySelector("[data-services='preview']");
  if (!focusedEl && !compEl && !select && !previewEl) return;

  const data = await getJSON("/data/services.json");
  if (!data) return;
  if (focusedEl) focusedEl.innerHTML = data.focused.items.map((i) => serviceCard(i)).join("");
  if (compEl) compEl.innerHTML = data.comprehensive.items.map((i) => serviceCard(i)).join("");
  if (voiceNotesEl) {
  voiceNotesEl.innerHTML = data["voice-notes"].items
    .map((i) => serviceCard(i))
    .join("");
}

if (internationalEl) {
  internationalEl.innerHTML = data.international.items
    .map((i) => serviceCard(i))
    .join("");
}

  // Populate service dropdown on contact page, if present
  if (select) {
    const all = [...data.focused.items, ...data.comprehensive.items];
    all.forEach((i) => {
      const opt = document.createElement("option");
      opt.value = i.id;
      opt.textContent = `${i.name} — ${rupee(i.price)}`;
      select.appendChild(opt);
    });
    const params = new URLSearchParams(location.search);
    const pre = params.get("service");
    if (pre && select.querySelector(`option[value="${pre}"]`)) select.value = pre;
  }

  // Small home-page preview (first 3 comprehensive-tier cards)
  if (previewEl) {
    previewEl.innerHTML = data.comprehensive.items.map((i) => serviceCard(i)).join("");
  }
}

/* ---------------- FAQ ---------------- */
function faqItem(item) {
  return `
    <details class="faq-item reveal">
      <summary>${item.q}<span class="faq-icon" aria-hidden="true"></span></summary>
      <p>${item.a}</p>
    </details>`;
}

async function renderFAQs() {
  const el = document.querySelector("[data-faqs]");
  if (!el) return;
  const data = await getJSON("/data/faqs.json");
  if (!data) return;
  const limit = el.dataset.faqs === "preview" ? 4 : data.length;
  el.innerHTML = data.slice(0, limit).map(faqItem).join("");
}

/* ---------------- Remedies / Store ---------------- */
function productFace(p, categoryId) {
  const mukhi = (p.name.match(/(\d+)\s*-?\s*Mukhi/i) || [])[1];
  let label;
  let sub;
  if (mukhi) {
    label = mukhi;
    sub = "Mukhi";
  } else {
    const clean = p.name
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .replace(/\b(bracelet|mala|rudraksh|rudraksha|gem|natural|polished|raw|frame|plate|sphere|tree|bowl|pyramid|underdeveloped)\b/gi, " ")
      .replace(/[-–—]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const words = clean.split(" ").filter(Boolean);
    if (!words.length) {
      label = p.name.slice(0, 12);
    } else if (words[0].length <= 3 && words[1]) {
      label = words.slice(0, 2).join(" ");
    } else {
      label = words.slice(0, words[0].length < 8 && words[1] ? 2 : 1).join(" ");
    }
    if (label.length > 14) label = label.slice(0, 13) + "…";
    const catLabel = {
      rudraksha: "Rudraksha",
      bracelets: "Bracelet",
      gemstones: "Gemstone",
      mala: "Mala",
      "other-remedies": "Remedy",
    };
    sub = catLabel[categoryId] || "Remedy";
  }
  return `
    <div class="product-media" data-cat="${categoryId || ""}" aria-hidden="true">
      <svg class="product-motif kundli-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 L100,0 L100,100 L0,100 Z"/>
        <line x1="0" y1="0" x2="100" y2="100"/>
        <line x1="100" y1="0" x2="0" y2="100"/>
        <path d="M50,0 L100,50 L50,100 L0,50 Z"/>
        <text x="50" y="13">Asc</text>
        <text x="74" y="27">Su</text>
        <text x="86" y="50">Mo</text>
        <text x="74" y="74">Ma</text>
        <text x="50" y="86">Bu</text>
        <text x="27" y="74">Ju</text>
        <text x="14" y="50">Ve</text>
        <text x="27" y="27">Sa</text>
      </svg>
      <div class="product-face">
        <span class="product-face-label">${label}</span>
        <span class="product-face-sub">${sub}</span>
      </div>
    </div>`;
}

function productCard(p, categoryId) {
  const delivery = p.deliveryChargesIncluded
    ? `<span class="badge">Delivery charges included</span>`
    : "";
  const cert = p.certificateImage ? `<span class="badge badge-outline">Certified</span>` : "";
  const priceLabel = p.priceLabel ? `<span class="hint" style="display:block; margin-top:0.15rem;">${p.priceLabel}</span>` : "";
  const desc = p.description ? `<p>${p.description}</p>` : "";
  const sig = (p.significance && p.significance.length)
    ? `<ul class="legal-content" style="margin:0 0 0.9rem; padding-left:1.1rem;">${p.significance.map(s => `<li style="font-size:0.88rem; color:var(--ink-70); margin-bottom:0.3rem;">${s}</li>`).join("")}</ul>`
    : "";
  const msg = `Hi ${CONFIG.brand}, I'd like to order: ${p.name} (${rupee(p.price)}).`;
  return `
    <div class="card product-card reveal" data-subcategory="${p.subcategory || ""}">
      ${productFace(p, categoryId)}
      <div class="product-top">
        <h3>${p.name}</h3>
        <span class="product-price">${rupee(p.price)}${priceLabel}</span>
      </div>
      ${desc}${sig}
      <div class="consult-meta">${delivery}${cert}</div>
      <a class="btn btn-brass" href="${waLink(msg)}" target="_blank" rel="noopener">Contact for Purchase</a>
    </div>`;
}

function emptyState(categoryName) {
  return `
    <div class="empty-state reveal">
      ${kundliMotifSVG()}
      <h3>${categoryName} — coming soon</h3>
      <p>These are being catalogued. Message us on WhatsApp if you'd like a recommendation before they're listed.</p>
      <a class="btn btn-outline" style="margin-top:1rem" href="${waLink(`Hi ${CONFIG.brand}, do you have any ${categoryName} available right now?`)}" target="_blank" rel="noopener">Ask on WhatsApp</a>
    </div>`;
}

async function renderRemedies() {
  const wrap = document.querySelector("[data-remedies]");
  if (!wrap) return;
  const data = await getJSON("/data/remedies.json");
  if (!data) return;

  const tabsEl = document.querySelector(".category-tabs");
  tabsEl.innerHTML = data.categories
    .map((c, i) => `<button class="tab-btn${i === 0 ? " is-active" : ""}" data-target="${c.id}">${c.name}</button>`)
    .join("");

  wrap.innerHTML = data.categories
    .map((c, i) => {
      const note = c.categoryNote ? `<p class="form-note" style="margin-bottom:var(--space-md);">${c.categoryNote}</p>` : "";
      const subfilter = c.subcategories && c.subcategories.length
        ? `<div class="sub-filter" data-subfilter="${c.id}">
             <button class="is-active" data-sub="all">All</button>
             ${c.subcategories.map((s) => `<button data-sub="${s.id}">${s.name}</button>`).join("")}
           </div>`
        : "";
      const grid = c.products.length
        ? `<div class="grid grid-3">${c.products.map((p) => productCard(p, c.id)).join("")}</div>`
        : emptyState(c.name);
      return `
        <div class="category-panel${i === 0 ? " is-active" : ""}" id="panel-${c.id}">
          <p class="lede">${c.description}</p>
          ${note}
          ${subfilter}
          ${grid}
        </div>`;
    })
    .join("");

  // Tab switching
  tabsEl.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      tabsEl.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      wrap.querySelectorAll(".category-panel").forEach((p) => p.classList.remove("is-active"));
      document.getElementById(`panel-${btn.dataset.target}`).classList.add("is-active");
    });
  });

  // Subcategory filtering
  wrap.querySelectorAll("[data-subfilter]").forEach((filterBar) => {
    const panel = filterBar.closest(".category-panel");
    const noMatch = document.createElement("p");
    noMatch.className = "form-note";
    noMatch.style.display = "none";
    noMatch.textContent = "Nothing listed under this filter yet — message us on WhatsApp and we'll help you find the right one.";
    filterBar.after(noMatch);
    filterBar.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBar.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const cards = panel.querySelectorAll(".product-card");
        let visibleCount = 0;
        cards.forEach((card) => {
          const show = btn.dataset.sub === "all" || card.dataset.subcategory === btn.dataset.sub;
          card.style.display = show ? "" : "none";
          if (show) visibleCount++;
        });
        noMatch.style.display = visibleCount === 0 ? "block" : "none";
      });
    });
  });

  initReveal();
}

/* ---------------- Reviews ---------------- */
function reviewCard(r) {
  const text = r.text ? `<p>${r.text}</p>` : "";
  const stars = "★★★★★".slice(0, Math.max(1, Math.min(5, Number(r.rating) || 5)));
  const name = r.anonymized ? "Name withheld by request" : r.name || "";
  return `
    <div class="card review-card reveal">
      <span class="review-mark" aria-hidden="true">"</span>
      <div class="review-stars" aria-label="${stars.length} out of 5">${stars}</div>
      ${text}
     <div class="review-meta">
         <span><b>${name}</b></span>
         <span>${r.country || ""} · ${r.service || ""}</span>
      </div>
    </div>`;
}

async function renderReviews() {
  const el = document.querySelector("[data-reviews]");
  if (!el) return;
  const data = await getJSON("/data/reviews.json");
  if (!data) return;
  const list = data.reviews || [];
  const limit = el.dataset.reviews === "preview" ? 6 : list.length;
  if (!list.length) {
    el.innerHTML = emptyState("Client reviews");
  } else {
    el.innerHTML = list.slice(0, limit).map(reviewCard).join("");
  }
}

/* ---------------- Kundli motif (reused inline) ---------------- */
function kundliMotifSVG() {
  return `<svg class="section-motif" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M0,0 L100,0 L100,100 L0,100 Z"/>
    <line x1="0" y1="0" x2="100" y2="100"/>
    <line x1="100" y1="0" x2="0" y2="100"/>
    <path d="M50,0 L100,50 L50,100 L0,50 Z"/>
    <text x="50" y="13">Asc</text>
    <text x="74" y="27">Su</text>
    <text x="86" y="50">Mo</text>
    <text x="74" y="74">Ma</text>
    <text x="50" y="86">Bu</text>
    <text x="27" y="74">Ju</text>
    <text x="14" y="50">Ve</text>
    <text x="27" y="27">Sa</text>
  </svg>`;
}

/* ---------------- Contact / booking form ---------------- */

function initContactForm() {
  const form = document.querySelector("#booking-form");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.querySelector("#name").value.trim();
    const phone = document.querySelector("#phone").value.trim();
    const email = document.querySelector("#email").value.trim();

    const serviceSelect = document.querySelector("#service-select");
    const service =
      serviceSelect.selectedOptions[0]?.text || "Not selected";

    const dob = document.querySelector("#dob").value;

    const tob =
      document.querySelector("#tob").value || "Not provided";

    const pob =
      document.querySelector("#pob").value.trim();

    const query =
      document.querySelector("#query").value.trim();

    const message = `*NEW CONSULTATION REQUEST*

*Name:* ${name}
*Phone / WhatsApp:* ${phone}
*Email:* ${email}

*Service:* ${service}

*Date of Birth:* ${dob}
*Time of Birth:* ${tob}
*Place of Birth:* ${pob}

*Question:*
${query}`;

    const whatsappURL =
      `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;

    window.open(whatsappURL, "_blank");
  });
}


/* ---------------- Init ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initHeroChart();
  renderServices();
  renderFAQs();
  renderRemedies();
  renderReviews();
  initContactForm();
  initReveal();

  // Re-run reveal for anything rendered synchronously above the fold
  setTimeout(initReveal, 300);
});