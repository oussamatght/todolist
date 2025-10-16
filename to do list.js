const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const clearBtn = document.getElementById("clear-btn");
const stats = document.getElementById("stats");
const undoBtn = document.getElementById("undo-btn");
const search = document.getElementById("search");

let todos = JSON.parse(localStorage.getItem("todos")) || [];
let lastDeleted = null;

function save() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function render() {
  list.innerHTML = "";
  const query = search.value.toLowerCase();
  const filtered = todos.filter(t => t.text.toLowerCase().includes(query));

  filtered.sort((a, b) => a.completed - b.completed);

  filtered.forEach((t, i) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = t.completed;

    const span = document.createElement("span");
    span.textContent = t.text;
    span.className = "todo-text";
    if (t.completed) span.classList.add("completed");

    const time = document.createElement("span");
    time.className = "todo-time";
    time.textContent = t.completed
      ? `✔ done ${timeAgo(t.completedAt)}`
      : `🕒 added ${timeAgo(t.createdAt)}`;

    checkbox.addEventListener("change", () => {
      t.completed = checkbox.checked;
      t.completedAt = new Date().toISOString();
      save();
      render();
    });

    const del = document.createElement("button");
    del.textContent = "🗑";
    del.style.border = "none";
    del.style.background = "none";
    del.style.cursor = "pointer";
    del.addEventListener("click", () => removeTodo(i));

    li.append(checkbox, span, time, del);
    list.appendChild(li);
  });

  updateStats();
  updateBg();
}

function addTodo(text) {
  todos.push({
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  });
  save();
  render();
}

function removeTodo(i) {
  const item = todos.splice(i, 1)[0];
  lastDeleted = item;
  save();
  render();
}

function updateStats() {
  const total = todos.length;
  const done = todos.filter(t => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  let msg = "Let's get started!";
  if (pct > 50 && pct < 100) msg = "You're doing great!";
  if (pct === 100 && total > 0) msg = "All done! 🎉";
  stats.textContent = `${done}/${total} completed (${pct}%) — ${msg}`;
}

function updateBg() {
  const done = todos.filter(t => t.completed).length;
  const total = todos.length;
  const ratio = total ? done / total : 0;
  const colors = [
    [102, 126, 234],
    [118, 75, 162],
  ];
  const mixed = colors[0].map((c, i) =>
    Math.round(c + (colors[1][i] - c) * ratio)
  );
  document.body.style.background = `linear-gradient(135deg, rgb(${mixed[0]},${mixed[1]},${mixed[2]}), #764ba2)`;
}

function timeAgo(time) {
  const diff = (Date.now() - new Date(time)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Event listeners
form.addEventListener("submit", e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTodo(text);
  input.value = "";
});

clearBtn.addEventListener("click", () => {
  if (confirm("Delete all tasks?")) {
    todos = [];
    save();
    render();
  }
});

undoBtn.addEventListener("click", () => {
  if (lastDeleted) {
    todos.push(lastDeleted);
    lastDeleted = null;
    save();
    render();
  }
});

search.addEventListener("input", render);

// Keyboard shortcuts
document.addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === "Backspace") {
    if (confirm("Clear all tasks?")) {
      todos = [];
      save();
      render();
    }
  }
});

render();
