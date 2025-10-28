"use strict";

var todoForm = document.getElementById("todoForm");
var todoText = document.getElementById("todoText");
var todoDue = document.getElementById("todoDue");
var todoPriority = document.getElementById("todoPriority");
var addBtn = document.getElementById("addBtn");
var todoList = document.getElementById("todoList");
var statTotal = document.getElementById("statTotal");
var statDone = document.getElementById("statDone");
var statPct = document.getElementById("statPct");
var progressBar = document.getElementById("progressBar");
var searchEl = document.getElementById("search");
var filterBtns = document.querySelectorAll(".filters button");
var undoBtn = document.getElementById("undoBtn");
var redoBtn = document.getElementById("redoBtn");
var clearBtn = document.getElementById("clearBtn");
var sortBtn = document.getElementById("sortBtn");
var themeToggle = document.getElementById("themeToggle");
var exportBtn = document.getElementById("exportBtn");
var importBtn = document.getElementById("importBtn");
var fileImport = document.getElementById("fileImport");

var STORAGE_KEY = "focuslist_state_v1";
var state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { todos: [] };

var undoStack = [];
var redoStack = [];
var currentFilter = "all";
var sortMode = "priority";

function saveStateImmediate() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

var saveTimeout = null;

function saveStateDebounced() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveStateImmediate, 250);
}

function saveState() {
    saveStateDebounced();
}

function updateUndoRedoUI() {
    if (undoBtn) undoBtn.disabled = undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

function uid() {
    return (
        Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    );
}

function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
}

function placeCaretAtEnd(el) {
    el.focus();
    if (window.getSelection && document.createRange) {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

function notify(message) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
        new Notification("FocusList", { body: message });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function(p) {
            if (p === "granted") new Notification("FocusList", { body: message });
        });
    }
}

function scheduleReminders() {
    if (window.__focuslistTimers) {
        Object.values(window.__focuslistTimers).forEach(clearTimeout);
    }
    window.__focuslistTimers = {};

    state.todos.forEach(function(t) {
        if (!t.due || t.completed) return;
        var when = new Date(t.due + "T09:00:00").getTime();
        var now = Date.now();
        var ms = when - now;
        if (ms > 0 && ms < 1000 * 60 * 60 * 24 * 7) {
            window.__focuslistTimers[t.id] = setTimeout(function() {
                notify("Task due today: " + t.text);
            }, ms);
        }
    });
}

function render() {
    var todos = Array.isArray(state.todos) ? state.todos.slice() : [];
    var q = (searchEl && searchEl.value ? searchEl.value : "").trim().toLowerCase();

    if (q) todos = todos.filter(function(t) { return t.text.toLowerCase().includes(q); });
    if (currentFilter === "pending") todos = todos.filter(function(t) { return !t.completed; });
    if (currentFilter === "completed") todos = todos.filter(function(t) { return t.completed; });
    if (currentFilter === "today") {
        var today = new Date().toISOString().slice(0, 10);
        todos = todos.filter(function(t) { return t.due === today; });
    }

    if (sortMode === "priority") {
        var order = { high: 0, normal: 1, low: 2 };
        todos.sort(function(a, b) {
            return (order[a.priority] !== undefined ? order[a.priority] : 1) -
                (order[b.priority] !== undefined ? order[b.priority] : 1);
        });
    } else if (sortMode === "due") {
        todos.sort(function(a, b) {
            return (a.due || "").localeCompare(b.due || "");
        });
    } else if (sortMode === "created") {
        todos.sort(function(a, b) {
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
    }

    if (!todoList) return;
    todoList.innerHTML = "";

    todos.forEach(function(t) {
        var li = document.createElement("li");
        li.className = "todo-item " + (t.priority || "normal") + (t.completed ? " completed" : "");
        li.draggable = true;
        li.dataset.id = t.id;
        li.innerHTML =
            '<div class="left">' +
            '<div class="checkbox" role="button" aria-pressed="' + (t.completed ? "true" : "false") + '">' + (t.completed ? "✓" : "") + "</div>" +
            '<div class="text">' +
            '<div class="title" contenteditable="true" spellcheck="false">' + escapeHtml(t.text) + "</div>" +
            '<div class="meta">' +
            (t.due ? '<span class="due">Due ' + t.due + "</span>" : "") +
            '<span class="created"> • ' + new Date(t.createdAt).toLocaleDateString() + "</span>" +
            "</div></div></div>" +
            '<div class="right">' +
            '<span class="badge ' + t.priority + '">' + t.priority + "</span>" +
            '<div><button class="icon-btn edit" title="Edit">✎</button>' +
            '<button class="icon-btn del" title="Delete">🗑</button></div></div>';

        var checkbox = li.querySelector(".checkbox");
        var titleEl = li.querySelector(".title");
        var delBtn = li.querySelector(".del");
        var editBtn = li.querySelector(".edit");

        checkbox.addEventListener("click", function() {
            pushUndo();
            var orig = state.todos.find(function(s) { return s.id === t.id; });
            if (orig) {
                orig.completed = !orig.completed;
                saveStateImmediate();
                render();
                scheduleReminders();
            }
        });

        delBtn.addEventListener("click", function() {
            pushUndo();
            state.todos = state.todos.filter(function(s) { return s.id !== t.id; });
            saveStateImmediate();
            render();
            scheduleReminders();
        });

        editBtn.addEventListener("click", function() {
            titleEl.focus();
            placeCaretAtEnd(titleEl);
        });

        titleEl.addEventListener("blur", function(e) {
            var newText = e.target.textContent.trim();
            if (newText !== t.text) {
                pushUndo();
                var orig = state.todos.find(function(s) { return s.id === t.id; });
                if (orig) {
                    orig.text = newText;
                    saveStateImmediate();
                    render();
                }
            }
        });

        li.addEventListener("dragstart", function(e) {
            e.dataTransfer.setData("text/plain", t.id);
            li.classList.add("dragging");
        });
        li.addEventListener("dragend", function() { li.classList.remove("dragging"); });
        li.addEventListener("dragover", function(e) { e.preventDefault(); });
        li.addEventListener("drop", function(e) {
            e.preventDefault();
            var sourceId = e.dataTransfer.getData("text/plain");
            var targetId = t.id;
            if (sourceId && sourceId !== targetId) {
                pushUndo();
                var srcIdx = state.todos.findIndex(function(x) { return x.id === sourceId; });
                var tgtIdx = state.todos.findIndex(function(x) { return x.id === targetId; });
                if (srcIdx > -1 && tgtIdx > -1) {
                    var m = state.todos.splice(srcIdx, 1)[0];
                    state.todos.splice(tgtIdx, 0, m);
                    saveStateImmediate();
                    render();
                }
            }
        });

        todoList.appendChild(li);
    });

    var total = state.todos.length;
    var done = state.todos.filter(function(t) { return t.completed; }).length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    if (statTotal) statTotal.textContent = total;
    if (statDone) statDone.textContent = done;
    if (statPct) statPct.textContent = pct + "%";
    if (progressBar) progressBar.style.width = pct + "%";

    updateUndoRedoUI();
}

function pushUndo() {
    undoStack.push(JSON.stringify(state.todos));
    if (undoStack.length > 100) undoStack.shift();
    redoStack = [];
    updateUndoRedoUI();
}

if (undoBtn) undoBtn.addEventListener("click", function() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(state.todos));
    state.todos = JSON.parse(undoStack.pop());
    saveStateImmediate();
    render();
});

if (redoBtn) redoBtn.addEventListener("click", function() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(state.todos));
    state.todos = JSON.parse(redoStack.pop());
    saveStateImmediate();
    render();
});

if (todoForm) todoForm.addEventListener("submit", function(e) {
    e.preventDefault();
    var text = (todoText && todoText.value ? todoText.value : "").trim();
    if (!text) return;
    pushUndo();
    var item = {
        id: uid(),
        text: text,
        due: todoDue && todoDue.value ? todoDue.value : null,
        priority: todoPriority && todoPriority.value ? todoPriority.value : "normal",
        completed: false,
        createdAt: Date.now(),
    };
    state.todos.push(item);
    if (todoText) todoText.value = "";
    if (todoDue) todoDue.value = "";
    if (todoPriority) todoPriority.value = "normal";
    saveStateImmediate();
    render();
    scheduleReminders();
    try {
        if (addBtn && addBtn.animate) {
            addBtn.animate([{ transform: "scale(1.0)" }, { transform: "scale(1.05)" }, { transform: "scale(1.0)" }], { duration: 220 });
        }
    } catch (err) {}
});

if (searchEl) searchEl.addEventListener("input", render);
filterBtns.forEach(function(b) {
    b.addEventListener("click", function() {
        filterBtns.forEach(function(x) { x.classList.remove("active"); });
        b.classList.add("active");
        currentFilter = b.dataset.filter;
        render();
    });
});

if (clearBtn) clearBtn.addEventListener("click", function() {
    if (!confirm("Clear all tasks?")) return;
    pushUndo();
    state.todos = [];
    saveStateImmediate();
    render();
});

if (sortBtn) sortBtn.addEventListener("click", function() {
    if (sortMode === "priority") {
        sortMode = "due";
        sortBtn.textContent = "Sort: Due";
    } else if (sortMode === "due") {
        sortMode = "created";
        sortBtn.textContent = "Sort: New";
    } else {
        sortMode = "priority";
        sortBtn.textContent = "Sort: Priority";
    }
    render();
});

if (themeToggle) themeToggle.addEventListener("click", function() {
    document.body.classList.toggle("dark");
    localStorage.setItem("focus_theme", document.body.classList.contains("dark") ? "dark" : "light");
});
if (localStorage.getItem("focus_theme") === "dark") document.body.classList.add("dark");

if (exportBtn) exportBtn.addEventListener("click", function() {
    try {
        var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "focuslist.json";
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        alert("Export failed");
    }
});

if (importBtn) importBtn.addEventListener("click", function() {
    if (fileImport) fileImport.click();
});

if (fileImport) fileImport.addEventListener("change", function(e) {
    var f = e.target.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function() {
        try {
            var parsed = JSON.parse(reader.result);
            if (parsed && Array.isArray(parsed.todos)) {
                pushUndo();
                state.todos = parsed.todos;
                saveStateImmediate();
                render();
                scheduleReminders();
                alert("Imported tasks");
            } else {
                alert("Invalid file");
            }
        } catch (err) {
            alert("Import failed");
        }
    };
    reader.readAsText(f);
    fileImport.value = "";
});

document.addEventListener("keydown", function(e) {
    if (e.key === "/" && document.activeElement !== searchEl) {
        e.preventDefault();
        if (searchEl) searchEl.focus();
        return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (undoBtn) undoBtn.click();
    }
    if (e.ctrlKey && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault();
        if (redoBtn) redoBtn.click();
    }
});

function load() {
    if (!Array.isArray(state.todos)) state.todos = [];
    render();
    scheduleReminders();
    updateUndoRedoUI();
}
load();

function checkDueToday() {
    var today = new Date().toISOString().slice(0, 10);
    var dueToday = state.todos.filter(function(t) { return !t.completed && t.due === today; });
    if (dueToday.length && "Notification" in window && Notification.permission === "granted") {
        notify("You have " + dueToday.length + " task(s) due today");
    }
}
checkDueToday();
setInterval(checkDueToday, 1000 * 60 * 60);
window.addEventListener("beforeunload", saveStateImmediate);
setInterval(saveStateImmediate, 30000);
setInterval(saveStateDebounced, 5000);
saveStateImmediate();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}
if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "state", data: state });
    var bc = new BroadcastChannel("focuslist_channel");
    bc.onmessage = function(ev) {
        if (ev.data && ev.data.type === "state") {
            state = ev.data.data;
            saveStateImmediate();
            render();
            scheduleReminders();
        }
    };
}

function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.warn("This browser does not support notifications.");
        return;
    }
    if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
            console.log("Notification permission:", perm);
        });
    }
}

function showNotification(title, body) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
        new Notification(title, {
            body,
            icon: "https://cdn-icons-png.flaticon.com/512/565/565547.png",
        });
    } else {
        console.log("🔕 Notification skipped:", title, body);
    }
}

requestNotificationPermission();
showNotification("✅ Task Added", `"${todoText.value}" has been added to your FocusList.`);
showNotification("🎯 Task Completed", `"${task.title}" marked as done!`);
setInterval(() => {
    const now = new Date().toISOString().split("T")[0];
    const dueToday = todos.filter(t => t.due === now && !t.done);
    if (dueToday.length > 0) {
        showNotification("📅 Tasks Due Today", `You have ${dueToday.length} task(s) due today!`);
    }
}, 3600000);
const toastContainer = document.createElement("div");
toastContainer.className = "toast-container";
document.body.appendChild(toastContainer);

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 100);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}
showToast(`✅ "${todoText.value}" added successfully!`, "success");

showToast(`🎯 "${task.title}" marked as done!`, "info");

showToast(`🗑️ "${task.title}" deleted.`, "error");

showToast("🧹 All tasks cleared!", "error");

showToast("📤 Tasks exported successfully!", "info");
showToast(`✅ "${todoText.value}" added successfully!`, "success");
showNotification("✅ Task Added", `"${todoText.value}" added to FocusList.`);
showToast(`🎯 "${task.title}" marked as done!`, "info");

showNotification("🎯 Task Completed", `"${task.title}" marked as done!`)
showToast(`🗑️ "${task.title}" deleted.`, "error"


);
showNotification("🗑️ Task Deleted", `"${task.title}" has been deleted.`)
showToast("🧹 All tasks cleared!", "error"

);
if (fileImport) fileImport.addEventListener("change", function(e) {
    var f = e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function(e) {
        state = JSON.parse(e.target.result);
        saveStateImmediate();
        render();
    };
    r.readAsText(f);
});
showNotification("📤 Tasks Exported", "Your tasks have been exported successfully.")
showToast("📤 Tasks exported successfully!", "info");

function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.warn("This browser does not support notifications.");
        return;
    }
    if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
            console.log("Notification permission:", perm);
        });
    } else {
        console.log("Notification permission already set to:", Notification.permission);
    }
}

