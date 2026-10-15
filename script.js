(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  /* ---------------------------------------------------------------- theme */
  $("#theme").addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) { /* storage may be blocked */ }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = next === "light" ? "#f5f8fc" : "#0b1220";
  });

  /* ---------------------------------------------------------------- nav */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const burger = $("#burger"), menu = $("#menu");
  const setMenu = (open) => { menu.classList.toggle("open", open); burger.setAttribute("aria-expanded", String(open)); };
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  $$("#menu a").forEach(a => a.addEventListener("click", () => setMenu(false)));

  // scroll-spy
  const links = new Map($$("#menu a").map(a => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { links.forEach(l => l.classList.remove("active")); const l = links.get(e.target.id); if (l) l.classList.add("active"); }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  /* ---------------------------------------------------------------- reveal / counters */
  const countUp = (el) => {
    const target = +el.dataset.count; if (reduce) { el.textContent = target; return; }
    const t0 = performance.now(), dur = 1400;
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$("[data-count]", e.target).forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  $$(".reveal, .hero-stack").forEach(el => io.observe(el));

  /* ---------------------------------------------------------------- typed headline */
  const typed = $("#typed");
  const words = ["decisions.", "retention strategies.", "predictive models.", "clear dashboards."];
  if (reduce) { typed.textContent = words[0]; }
  else {
    let w = 0, i = 0, del = false;
    const step = () => {
      const word = words[w];
      typed.textContent = word.slice(0, i);
      let delay = del ? 35 : 75;
      if (!del && i === word.length) { del = true; delay = 1600; }
      else if (del && i === 0) { del = false; w = (w + 1) % words.length; delay = 350; }
      i += del ? -1 : 1;
      setTimeout(step, delay);
    };
    step();
  }

  /* ---------------------------------------------------------------- hero: tilt + network */
  const stack = $("#stack");
  if (!reduce && matchMedia("(hover: hover)").matches) {
    const cards = $$(".gcard", stack);
    addEventListener("mousemove", (e) => {
      const r = stack.getBoundingClientRect();
      if (e.clientY < r.top - 200 || e.clientY > r.bottom + 200) return;
      const x = (e.clientX - (r.left + r.width / 2)) / r.width, y = (e.clientY - (r.top + r.height / 2)) / r.height;
      cards.forEach(c => { const d = +c.dataset.depth; c.style.transform = `translate3d(${x * d}px, ${y * d}px, 0) rotateX(${-y * 5}deg) rotateY(${x * 7}deg)`; });
    }, { passive: true });
  }

  const cv = $("#net"), ctx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1, nodes = [], mouse = { x: -999, y: -999 }, running = true;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(24, Math.min(70, Math.round(W * H / 17000)));
    nodes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }));
  };
  const css = (v) => getComputedStyle(root).getPropertyValue(v).trim();
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const c1 = css("--a1"), c2 = css("--a2");
    for (const a of nodes) {
      if (!reduce) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1; }
      ctx.beginPath(); ctx.arc(a.x, a.y, 1.8, 0, 6.283); ctx.fillStyle = c1; ctx.globalAlpha = .65; ctx.fill();
    }
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 130) { ctx.globalAlpha = (1 - d / 130) * .35; ctx.strokeStyle = c2; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    for (const a of nodes) {
      const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (d < 150) { ctx.globalAlpha = (1 - d / 150) * .6; ctx.strokeStyle = c1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  };
  const loop = () => { if (running) draw(); if (!reduce) requestAnimationFrame(loop); };
  resize(); addEventListener("resize", resize);
  cv.parentElement.addEventListener("mousemove", (e) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  cv.parentElement.addEventListener("mouseleave", () => { mouse.x = mouse.y = -999; });
  new IntersectionObserver((en) => { running = en[0].isIntersecting; }).observe(cv);
  document.addEventListener("visibilitychange", () => { running = !document.hidden; });
  draw(); if (!reduce) requestAnimationFrame(loop);

  /* ---------------------------------------------------------------- experience accordion */
  $$(".job-head").forEach(btn => btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    document.getElementById(btn.getAttribute("aria-controls")).hidden = open;
  }));

  /* ---------------------------------------------------------------- projects: filter + modal */
  $$("[data-filter]").forEach(chip => chip.addEventListener("click", () => {
    $$("[data-filter]").forEach(c => c.classList.toggle("on", c === chip));
    const f = chip.dataset.filter;
    $$(".pcard").forEach(card => card.classList.toggle("hide", f !== "all" && card.dataset.type !== f));
  }));

  const GH = "https://github.com/rolivaresIA/";
  const P = {
    competitor: {
      tags: ["Work", "Real results"], title: "Competitor Contact & Churn Impact Analytics",
      sections: [
        ["The problem", "Competitors call our customers to induce them to port out, and there was no automated way to measure it at Claro Chile."],
        ["What I built", "A daily BigQuery pipeline with three tables: it normalises incoming call traffic, detects competitor calls with prefix rules, links them to the active customer base, and measures port-out within a 5-day window, segmented by operator and call duration. A Looker Studio dashboard serves management and the VP of the consumer market."],
        ["Results", ["~700k calls processed per day (~300k answered)", "Calls longer than 5 minutes (~1% of answered calls) have <b>4-6x higher port-out probability</b>", "~600 customers contacted daily through early-retention campaigns", "Estimated churn reduction of 35-45% in the intervened segment (an estimate, not a measured guarantee)"]],
        ["Good to know", "The last 5 days of the report still have an open window, so their rates look artificially low."],
      ],
      links: [["View on GitHub", GH + "Competitor-Contact-Churn-Impact-Analytics"]],
    },
    kpi: {
      tags: ["Work", "Real results", "Synthetic demo"], title: "Silent-Sales KPI Redesign",
      sections: [
        ["The problem", "The \"Silentes\" KPI flagged activations with no traffic in 21 days so the sales could be decommissioned. It had not changed in years while behaviour kept changing."],
        ["What I did", "Measured the KPI against what really happened on the network, then trained a depth-3 decision tree as an interpretability tool to extract simple rules."],
        ["Results", ["Current KPI: <b>67% precision, 9.3% recall</b> (very accurate, but misses most low-quality sales)", "Proposal 1 (strict rule): 91.5% precision, 6.2% recall", "Proposal 2 (broader rule): 58.9% precision, 33% recall", "The right choice depends on the cost of wrongly decommissioning vs missing a bad sale"]],
        ["Reproducible demo", "The repository includes a runnable demo on <b>synthetic data</b> (the real data is confidential). Its numbers differ from the real ones and are labelled as synthetic."],
      ],
      links: [["View on GitHub", GH + "Silents-KPI-Sales-Quality-Fraud-Detection"]],
    },
    telemetry: {
      tags: ["Work", "Synthetic data"], title: "Machinery Failure Telemetry Analysis",
      sections: [
        ["The problem", "At SALFA, a heavy-equipment dealer, customers called after a machine had already failed. The goal: contact them earlier by predicting which alerts become critical."],
        ["What I built", "A reproducible R pipeline: data understanding, quality checks with a missing-value bias analysis, outlier treatment, EDA, and a model comparison (logistic regression vs tuned random forest) with machine-grouped cross-validation, ROC and precision-recall curves, gains and calibration."],
        ["Results", ["Logistic regression selected by cross-validation: <b>ROC AUC 0.77</b> on held-out machines (random forest 0.74)", "Prioritising the top 10% of alerts by risk captures 32% of the critical ones", "Leakage control and a split by machine, so the evaluation is honest"]],
        ["Important", "The original data is confidential, so everything runs on <b>synthetic data</b> where the signal was deliberately built in. The metrics show the method works; they are not performance claims for real machines."],
      ],
      links: [["View on GitHub", GH + "Machinery-Failure-Telemetry-Analysis"]],
    },
    dropout: {
      tags: ["Personal", "Technical assessment"], title: "School Dropout Dashboard (Chile)",
      sections: [
        ["The challenge", "A technical assessment for the Data Science Unit of the Chilean Ministry of Education: quantify school dropout in subsidised private schools and visualise it."],
        ["What I did", "Joined the 2023 performance and 2024 enrolment files with an anti-join, found and removed 14,885 duplicated student IDs, computed theoretical enrolment and dropout rate by region and by school, and built an interactive Power BI dashboard plus policy proposals."],
        ["Results", ["<b>332,766</b> students left subsidised private schools in 2023-24", "Regional dropout rates between 12.7% and 16.5%", "Rates vary much more between schools than between regions"]],
        ["Caveat I documented", "\"Dropout\" here means leaving this school type, not necessarily the whole system, and graduating students are probably counted."],
      ],
      links: [["View on GitHub", GH + "School-Dropout-Dashboard-PowerBI"]],
    },
    twitch: {
      tags: ["Personal"], title: "Twitch Streamers EDA",
      sections: [
        ["The question", "A close friend wants to grow as a Spanish-speaking streamer. What do the top Twitch channels do differently?"],
        ["What I did", "Exploratory analysis of the top 1,000 streamers (999 rows x 17 variables), then a deeper look at the 106 Spanish-speaking ones: games, weekdays, stream length and correlations."],
        ["Findings", ["English is 40% of the top 1,000; Spanish is 10.6%", "Just Chatting is the most common main category (25.7%)", "Among Spanish-speaking streamers the median stream is ~4 hours", "Recommendations: 4-5 hour streams, focus on Wednesday, Thursday and Sunday, and promote clips on other platforms"]],
        ["Honest limits", "A single snapshot of already-successful channels (survivorship bias), many games with only a few streamers, and moderate correlations that do not imply causation."],
      ],
      links: [["View on GitHub", GH + "EDA_Twitch"]],
    },
    shein: {
      tags: ["Personal"], title: "E-commerce Data Cleaning",
      sections: [
        ["The challenge", "A deliberately dirty Kaggle dataset: 21 category files with inconsistent names, wrong types, missing values and duplicated products."],
        ["What I did", "A reproducible R pipeline that combines the files, standardises names and types, makes explicit decisions on missing values, merges duplicated products (keeping the highest price when prices differ) and exports a clean file."],
        ["Result", ["82,105 raw rows turned into <b>71,480 unique products</b> x 7 variables", "Every decision is documented in a generated report"]],
      ],
      links: [["View on GitHub", GH + "Data_Cleaning_Project"]],
    },
  };

  const dlg = $("#modal"), body = $("#m-body");
  const pillClass = (t) => (t === "Real results" ? "ok" : t === "Personal" ? "pers" : /Synthetic/.test(t) ? "syn" : "");
  const openProject = (id) => {
    const p = P[id]; if (!p) return;
    const sec = p.sections.map(([h, c]) => `<h4>${h}</h4>` + (Array.isArray(c) ? `<ul>${c.map(x => `<li>${x}</li>`).join("")}</ul>` : `<p>${c}</p>`)).join("");
    body.innerHTML = `<div class="m-head"><p class="kind">${p.tags.map(t => `<span class="pill ${pillClass(t)}">${t}</span>`).join("")}</p><h3 id="m-title">${p.title}</h3></div>
      <div class="m-body">${sec}<div class="m-links">${p.links.map(([t, u]) => `<a class="btn btn-sm" href="${u}">${t}</a>`).join("")}<button class="btn btn-sm btn-ghost" type="button" data-close>Close</button></div></div>`;
    dlg.showModal();
  };
  $$(".pcard").forEach(card => {
    card.addEventListener("click", () => openProject(card.dataset.id));
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProject(card.dataset.id); } });
  });
  $("#m-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });

  /* ---------------------------------------------------------------- skills */
  const note = $("#skill-note"), defaultNote = note.textContent;
  $$("[data-skill]").forEach(chip => chip.addEventListener("click", () => {
    $$("[data-skill]").forEach(c => c.classList.toggle("on", c === chip));
    const f = chip.dataset.skill;
    $$("#skills-list li").forEach(li => li.classList.toggle("dim", f !== "all" && li.dataset.cat !== f));
  }));
  $$("#skills-list li").forEach(li => {
    const show = () => { $$("#skills-list li").forEach(x => x.classList.toggle("sel", x === li)); note.textContent = `${li.textContent}: ${li.dataset.used}`; };
    li.addEventListener("mouseenter", show); li.addEventListener("focus", show); li.addEventListener("click", show);
    li.addEventListener("mouseleave", () => { li.classList.remove("sel"); note.textContent = defaultNote; });
  });

  /* ---------------------------------------------------------------- copy email, year */
  const copy = $("#copy"), label = $("#copy-label");
  copy.addEventListener("click", async () => {
    const email = copy.dataset.email;
    try { await navigator.clipboard.writeText(email); label.textContent = "Copied to clipboard"; }
    catch (e) { location.href = "mailto:" + email; return; }
    setTimeout(() => { label.textContent = email; }, 1800);
  });
  $("#year").textContent = new Date().getFullYear();
})();
