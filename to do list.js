const input = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("todo-list");
const clearBtn = document.getElementById("clear-btn");
const taskInfo = document.getElementById("task-info");

let todos = JSON.parse(localStorage.getItem("todos")) || [];

function updateLocalStorage() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function updateTaskInfo() {
  const total = todos.length;
  const pending = todos.filter((t) => !t.completed).length;
  const completed = total - pending;

  taskInfo.innerHTML = `
    You have <strong>${pending}</strong> pending task${pending !== 1 ? "s" : ""} 
    and <strong>${completed}</strong> completed.
  `;

  const progress = document.querySelector(".progress");
  if (progress) {
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    progress.style.width = percent + "%";
    progress.textContent = percent + "%";
  }
}

function renderTodos() {
  list.innerHTML = "";

  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.classList.add("todo-item");
    li.setAttribute("draggable", "true");
    li.dataset.index = index;

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = todo.completed;
    check.className = "todo-check";
    check.addEventListener("change", () => {
      todo.completed = check.checked;
      updateLocalStorage();
      renderTodos();
    });

    const span = document.createElement("span");
    span.classList.add("todo-text");
    if (todo.completed) span.classList.add("completed");
    span.textContent = todo.text;

    span.addEventListener("dblclick", () => {
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.value = todo.text;
      editInput.className = "edit-input";
      li.replaceChild(editInput, span);
      editInput.focus();

      editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          todo.text = editInput.value.trim();
          updateLocalStorage();
          renderTodos();
        } else if (e.key === "Escape") {
          renderTodos();
        }
      });

      editInput.addEventListener("blur", () => {
        todo.text = editInput.value.trim();
        updateLocalStorage();
        renderTodos();
      });
    });

    const date = document.createElement("small");
    date.classList.add("date");
    date.textContent = new Date(todo.date).toLocaleDateString();

    const del = document.createElement("button");
    del.classList.add("delete-btn");
    del.textContent = "🗑";
    del.addEventListener("click", () => {
      todos.splice(index, 1);
      updateLocalStorage();
      renderTodos();
    });

    li.append(check, span, date, del);
    list.appendChild(li);
  });

  updateTaskInfo();
  enableDragAndDrop();
}

function addTask() {
  const text = input.value.trim();
  if (!text) return;

  todos.push({
    text,
    completed: false,
    date: new Date().toISOString(),
  });

  input.value = "";
  updateLocalStorage();
  renderTodos();
}

addBtn.addEventListener("click", addTask);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

clearBtn.addEventListener("click", () => {
  if (todos.length === 0) return;
  if (confirm("Are you sure you want to delete all tasks?")) {
    todos = [];
    updateLocalStorage();
    renderTodos();
  }
});

function enableDragAndDrop() {
  const items = list.querySelectorAll(".todo-item");

  items.forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", item.dataset.index);
      item.classList.add("dragging");
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
    });

    item.addEventListener("dragover", (e) => e.preventDefault());

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      const fromIndex = e.dataTransfer.getData("text/plain");
      const toIndex = item.dataset.index;

      const [moved] = todos.splice(fromIndex, 1);
      todos.splice(toIndex, 0, moved);
      updateLocalStorage();
      renderTodos();
    });
  });
}

const search = document.createElement("input");
search.type = "text";
search.placeholder = "Search tasks...";
search.className = "search-input";
document.querySelector(".todo-box").insertBefore(search, list);

search.addEventListener("input", () => {
  const q = search.value.toLowerCase();
  const filtered = todos.filter((t) => t.text.toLowerCase().includes(q));
  list.innerHTML = "";
  filtered.forEach((todo) => {
    const li = document.createElement("li");
    li.classList.add("todo-item");
    li.innerHTML = `<span class="todo-text ${todo.completed ? "completed" : ""}">${todo.text}</span>`;
    list.appendChild(li);
  });
});

const progressContainer = document.createElement("div");
progressContainer.classList.add("progress-container");
progressContainer.innerHTML = `<div class="progress"></div>`;
document.querySelector(".todo-box").appendChild(progressContainer);

renderTodos();
