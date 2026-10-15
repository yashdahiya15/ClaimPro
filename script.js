
const sampleClaims = [
  {
    id: 1,
    name: "Yash",
    policy: "POL-1001",
    type: "Health",
    date: "2026-10-01",
    amount: 25000,
    description: "Hospital treatment",
    status: "Under Review",
    document: "",
    comments: "",
    history: ["Claim Filed"]
  },
  {
    id: 2,
    name: "Soorav",
    policy: "POL-1002",
    type: "Vehicle",
    date: "2026-10-03",
    amount: 18000,
    description: "Vehicle accident",
    status: "Approved",
    document: "",
    comments: "Documents verified",
    history: ["Claim Filed", "Approved"]
  }
];

let claims;

try {
  const saved = localStorage.getItem("claimpro-data");
  claims = saved ? JSON.parse(saved) : sampleClaims;
  if (!Array.isArray(claims)) claims = sampleClaims;
} catch {
  claims = sampleClaims;
}

const $ = id => document.getElementById(id);

function saveData() {
  try {
    localStorage.setItem("claimpro-data", JSON.stringify(claims));
  } catch {
    alert("Browser storage is unavailable. Changes may not persist.");
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function money(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function showPage(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("hidden", section.id !== page);
  });

  document.querySelectorAll(".sidebar button").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    dashboard: "Dashboard",
    filing: "File Claim",
    claims: "Claim List",
    review: "Review & Approval",
    settlement: "Settlement",
    documents: "Documents",
    reports: "Reports"
  };

  $("page-title").textContent = titles[page] || "ClaimPro";
}

document.querySelectorAll(".sidebar button").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

function renderDashboard() {
  $("total").textContent = claims.length;
  $("pending").textContent = claims.filter(c =>
    ["Filed", "Pending", "Under Review"].includes(c.status)
  ).length;
  $("approved").textContent = claims.filter(c =>
    c.status === "Approved"
  ).length;
  $("settled").textContent = claims.filter(c =>
    c.status === "Settled"
  ).length;

  $("recent-claims").innerHTML = claims.length
    ? claims.slice(-5).reverse().map(c => `
        <div class="panel">
          <strong>${escapeHTML(c.name)}</strong>
          <p>${escapeHTML(c.id)} · ${escapeHTML(c.type)}</p>
          <span class="status">${escapeHTML(c.status)}</span>
          <p>${money(c.amount)}</p>
          <button data-detail="${c.id}">View Details</button>
        </div>
      `).join("")
    : "<p>No claims have been filed yet.</p>";
}

function renderClaims() {
  const query = $("search").value.toLowerCase();
  const status = $("status-filter").value;

  const filtered = claims.filter(c =>
    (c.name.toLowerCase().includes(query) ||
     ("CLM-" + String(c.id).padStart(4, "0")).toLowerCase().includes(query) ||
     c.policy.toLowerCase().includes(query)) &&
    (!status || c.status === status)
  );

  $("claims-list").innerHTML = filtered.length
    ? `<div style="overflow-x:auto"><table>
        <thead><tr>
          <th>Claim ID</th><th>Name</th><th>Type</th>
          <th>Amount</th><th>Status</th><th>Action</th>
        </tr></thead>
        <tbody>${filtered.map(c => `
          <tr>
            <td>CLM-${String(c.id).padStart(4, "0")}</td>
            <td>${escapeHTML(c.name)}</td>
            <td>${escapeHTML(c.type)}</td>
            <td>${money(c.amount)}</td>
            <td><span class="status">${escapeHTML(c.status)}</span></td>
            <td><button data-detail="${c.id}">Details</button></td>
          </tr>
        `).join("")}</tbody>
      </table></div>`
    : "<p>No matching claims found.</p>";
}

function renderReview() {
  const reviewable = claims.filter(c =>
    ["Filed", "Pending", "Under Review"].includes(c.status)
  );

  $("review-list").innerHTML = reviewable.length
    ? reviewable.map(c => `
      <div class="panel">
        <h3>${escapeHTML(c.name)} — CLM-${c.id}</h3>
        <p>Policy: ${escapeHTML(c.policy)}</p>
        <p>Type: ${escapeHTML(c.type)} | Amount: ${money(c.amount)}</p>
        <p>${escapeHTML(c.description)}</p>
        <label>Review comments</label>
        <input id="comment-${c.id}" placeholder="Enter review comments">
        <div class="actions">
          <button data-review="Approved" data-id="${c.id}">Approve</button>
          <button data-review="Rejected" data-id="${c.id}">Reject</button>
          <button data-review="Under Review" data-id="${c.id}">Under Review</button>
        </div>
      </div>
    `).join("")
    : "<p>No claims are waiting for review.</p>";
}

function renderSettlements() {
  const eligible = claims.filter(c =>
    ["Approved", "Settled"].includes(c.status)
  );

  $("settlement-list").innerHTML = eligible.length
    ? eligible.map(c => `
      <div class="panel">
        <h3>${escapeHTML(c.name)} — CLM-${c.id}</h3>
        <p>Claim amount: ${money(c.amount)}</p>
        <p>Status: ${escapeHTML(c.status)}</p>
        ${c.status === "Approved"
          ? `<button data-settle="${c.id}">Mark as Settled</button>`
          : "<span class='status'>Settlement recorded</span>"}
      </div>
    `).join("")
    : "<p>No approved claims are available for settlement.</p>";
}

function renderDocuments() {
  $("documents-list").innerHTML = claims.length
    ? claims.map(c => `
      <div class="panel">
        <strong>CLM-${c.id} — ${escapeHTML(c.name)}</strong>
        <p>Document: ${escapeHTML(c.document || "No document selected")}</p>
      </div>
    `).join("")
    : "<p>No claim documents available.</p>";
}

function renderReports() {
  const total = claims.length;
  const approved = claims.filter(c =>
    ["Approved", "Settled"].includes(c.status)
  ).length;
  const settled = claims.filter(c => c.status === "Settled");
  const amount = settled.reduce((sum, c) => sum + Number(c.amount), 0);
  const rate = total ? Math.round(approved / total * 100) : 0;

  $("report-summary").innerHTML = `
    <div class="stats">
      <div class="card">Total Claims<h2>${total}</h2></div>
      <div class="card">Approved / Settled<h2>${approved}</h2></div>
      <div class="card">Approval Rate<h2>${rate}%</h2></div>
      <div class="card">Settled Amount<h2>${money(amount)}</h2></div>
    </div>
    <p>Approval rate here includes both approved and settled claims.</p>
  `;
}

function renderAll() {
  renderDashboard();
  renderClaims();
  renderReview();
  renderSettlements();
  renderDocuments();
  renderReports();
}

$("claim-form").addEventListener("submit", event => {
  event.preventDefault();

  const form = event.currentTarget;
  const data = new FormData(form);
  const file = data.get("document");

  const claim = {
    id: claims.length
      ? Math.max(...claims.map(c => Number(c.id) || 0)) + 1
      : 1,
    name: data.get("name").trim(),
    policy: data.get("policy").trim(),
    type: data.get("type"),
    date: data.get("date"),
    amount: Number(data.get("amount")),
    description: data.get("description").trim(),
    status: "Filed",
    document: file && file.size ? file.name : "",
    comments: "",
    history: ["Claim Filed"]
  };

  if (!claim.name || !claim.policy ||
      !claim.description || claim.amount <= 0) {
    $("form-message").textContent = "Please enter valid claim details.";
    return;
  }

  claims.push(claim);
  saveData();
  renderAll();
  form.reset();

  $("form-message").textContent =
    `Claim submitted successfully. Claim ID: CLM-${claim.id}`;

  showPage("dashboard");
});

$("search").addEventListener("input", renderClaims);
$("status-filter").addEventListener("change", renderClaims);

document.addEventListener("click", event => {
  const detailButton = event.target.closest("[data-detail]");

  if (detailButton) {
    const c = claims.find(c => c.id === Number(detailButton.dataset.detail));
    if (!c) return;

    alert(
      `Claim ID: CLM-${c.id}\n` +
      `Name: ${c.name}\nPolicy: ${c.policy}\n` +
      `Type: ${c.type}\nAmount: ${money(c.amount)}\n` +
      `Status: ${c.status}\nDescription: ${c.description}\n` +
      `Comments: ${c.comments || "None"}\n` +
      `History: ${c.history.join(" → ")}`
    );
  }

  const reviewButton = event.target.closest("[data-review]");

  if (reviewButton) {
    const c = claims.find(c => c.id === Number(reviewButton.dataset.id));
    if (!c) return;

    const comment = $("comment-" + c.id).value.trim();

    if (["Approved", "Rejected"].includes(reviewButton.dataset.review)
        && !comment) {
      alert("Enter review comments before approving or rejecting.");
      return;
    }

    c.status = reviewButton.dataset.review;
    c.comments = comment || "Review in progress";
    c.history.push(c.status + ": " + c.comments);

    saveData();
    renderAll();
  }

  const settleButton = event.target.closest("[data-settle]");

  if (settleButton) {
    const c = claims.find(c => c.id === Number(settleButton.dataset.settle));
    if (!c || c.status !== "Approved") return;

    if (confirm(`Mark claim CLM-${c.id} as settled?`)) {
      c.status = "Settled";
      c.history.push("Settlement recorded");
      saveData();
      renderAll();
    }
  }
});

$("theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

$("export-csv").addEventListener("click", () => {
  const headers = [
    "Claim ID", "Name", "Policy", "Type",
    "Date", "Amount", "Status", "Comments"
  ];

  const rows = claims.map(c => [
    "CLM-" + c.id, c.name, c.policy, c.type,
    c.date, c.amount, c.status, c.comments
  ]);

  const csvCell = value =>
    '"' + String(value ?? "").replace(/"/g, '""') + '"';

  const csv = [headers, ...rows]
    .map(row => row.map(csvCell).join(","))
    .join("\r\n");

  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = "claimpro-report.csv";
  link.click();
  URL.revokeObjectURL(url);
});

renderAll();
showPage("dashboard");
