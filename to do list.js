const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todoinput");
const todoList = document.getElementById("todolist");
const filterButtons = document.querySelectorAll(".filters button");
const clearAllBtn = document.getElementById("clearAll");

let todos = JSON.parse(localStorage.getItem("todos")) || [];
let currentFilter = "all";

todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;
  todos.push({ text, completed: false });
  todoInput.value = "";
  saveAndRender();
});

function saveAndRender() {
  localStorage.setItem("todos", JSON.stringify(todos));
  renderTodos();
}

function renderTodos() {
  todoList.innerHTML = "";

  let filtered = todos;
  if (currentFilter === "pending") {
    filtered = todos.filter((t) => !t.completed);
  } else if (currentFilter === "completed") {
    filtered = todos.filter((t) => t.completed);
  }

  filtered.forEach((todo, index) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");

    li.innerHTML = `
      <input type="checkbox" ${todo.completed ? "checked" : ""}/>
      <span class="text" contenteditable="true">${todo.text}</span>
      <div class="actions">
        <button class="delete">🗑</button>
      </div>
    `;

    const chk = li.querySelector("input[type='checkbox']");
    const delBtn = li.querySelector(".delete");
    const textSpan = li.querySelector(".text");

    chk.addEventListener("change", () => {
      // we need to find the original todo in todos array
      const realIndex = todos.findIndex((t) => t === todo);
      if (realIndex >= 0) {
        todos[realIndex].completed = chk.checked;
        saveAndRender();
      }
    });

    delBtn.addEventListener("click", () => {
      const realIndex = todos.findIndex((t) => t === todo);
      if (realIndex >= 0) {
        todos.splice(realIndex, 1);
        saveAndRender();
      }
    });

    textSpan.addEventListener("blur", () => {
      const newText = textSpan.textContent.trim();
      const realIndex = todos.findIndex((t) => t === todo);
      if (realIndex >= 0 && newText) {
        todos[realIndex].text = newText;
        saveAndRender();
      }
    });

    todoList.appendChild(li);
  });
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

clearAllBtn.addEventListener("click", () => {
  if (confirm("Delete all tasks?")) {
    todos = [];
    saveAndRender();
  }
});

renderTodos();
