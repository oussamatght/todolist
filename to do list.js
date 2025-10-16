const form = document.getElementById("todo-form");
const input = document.getElementById("todoinput");
const list = document.getElementById("todolist");
const filters = document.querySelectorAll(".filters button");
const clearAll = document.getElementById("clearAll");
const progressBar = document.getElementById("progress-bar");
const pendingCount = document.getElementById("pending-count");
const completedCount = document.getElementById("completed-count");
const themeToggle = document.getElementById("theme-toggle");

const searchBar = document.createElement("input");
searchBar.type = "text";
searchBar.placeholder = "Search tasks...";
searchBar.id = "search";
searchBar.style.cssText =
    "width:100%;padding:10px;margin-bottom:15px;border-radius:8px;border:1px solid #ccc;font-size:1rem;outline:none;";
form.insertAdjacentElement("afterend", searchBar);

let todos = JSON.parse(localStorage.getItem("todos")) || [];
let currentFilter = "all";
let lastDeleted = null;
let messageTimeout;

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "🌙";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    themeToggle.textContent = isDark ? "🌙" : "☀️";
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    todos.push({
        id: Date.now(),
        text,
        completed: false,
        createdAt: new Date().toLocaleDateString(),
    });

    input.value = "";
    showMessage("Task added ✓");
    saveAndRender();
});

function render() {
    list.innerHTML = "";
    let filtered = todos;

    const query = searchBar.value.toLowerCase();
    filtered = filtered.filter((t) => t.text.toLowerCase().includes(query));

    if (currentFilter === "pending") filtered = filtered.filter((t) => !t.completed);
    else if (currentFilter === "completed") filtered = filtered.filter((t) => t.completed);

    if (filtered.length === 0) {
        list.innerHTML = `<p style="text-align:center; opacity:.6;">No tasks to show.</p>`;
        updateStats();
        return;
    }

    filtered.forEach((todo) => {
        const li = document.createElement("li");
        li.className = "todo-item" + (todo.completed ? " completed" : "");

        li.innerHTML = `
      <input type="checkbox" ${todo.completed ? "checked" : ""}>
      <div class="text-section">
        <div class="text" contenteditable="true">${todo.text}</div>
        <div class="date">${todo.createdAt}</div>
      </div>
      <div class="actions">
        <button class="undo" title="Undo delete" style="display:none;">↩</button>
        <button class="delete">✖</button>
      </div>
    `;

        const checkbox = li.querySelector("input");
        const del = li.querySelector(".delete");
        const textEl = li.querySelector(".text");

        checkbox.addEventListener("change", () => {
            todo.completed = checkbox.checked;
            saveAndRender();
            showMessage(todo.completed ? "Marked as completed" : "Marked as pending");
        });

        del.addEventListener("click", () => {
            lastDeleted = todo;
            todos = todos.filter((t) => t.id !== todo.id);
            saveAndRender();
            showMessage("Task deleted — press Ctrl+Z to undo");
        });

        textEl.addEventListener("focus", () => {
            textEl.classList.add("editing");
            showMessage("Editing task...");
        });

        textEl.addEventListener("blur", () => {
            textEl.classList.remove("editing");
            todo.text = textEl.textContent.trim();
            saveAndRender();
            showMessage("Task updated ✓");
        });

        list.appendChild(li);
    });

    updateStats();
}

function updateStats() {
    const completed = todos.filter((t) => t.completed).length;
    const pending = todos.length - completed;
    pendingCount.textContent = pending;
    completedCount.textContent = completed;
    const percent = todos.length ? (completed / todos.length) * 100 : 0;
    progressBar.style.width = `${percent}%`;
}

function saveAndRender() {
    localStorage.setItem("todos", JSON.stringify(todos));
    render();
}

clearAll.addEventListener("click", () => {
    if (confirm("Delete all tasks?")) {
        todos = [];
        saveAndRender();
        showMessage("All tasks cleared");
    }
});

filters.forEach((btn) =>
    btn.addEventListener("click", () => {
        filters.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        render();
    })
);

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "z") {
        if (lastDeleted) {
            todos.push(lastDeleted);
            showMessage("Undo successful ✓");
            lastDeleted = null;
            saveAndRender();
        } else {
            showMessage("Nothing to undo");
        }
    }
});

searchBar.addEventListener("input", render);

document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchBar) {
        e.preventDefault();
        searchBar.focus();
    }
});

function showMessage(text) {
    let msg = document.getElementById("toast");
    if (!msg) {
        msg = document.createElement("div");
        msg.id = "toast";
        msg.style.cssText =
            "position:fixed;bottom:25px;left:50%;transform:translateX(-50%);background:#3b82f6;color:#fff;padding:10px 16px;border-radius:8px;transition:0.3s;opacity:0;font-size:0.9rem;z-index:999;";
        document.body.appendChild(msg);
    }
    msg.textContent = text;
    msg.style.opacity = "1";
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => (msg.style.opacity = "0"), 2000);
}

render();
