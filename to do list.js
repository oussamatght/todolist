const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todoinput");
const todoList = document.getElementById("todolist");
const filterButtons = document.querySelectorAll(".filters button");
const clearAll = document.getElementById("clearAll");

let todos = JSON.parse(localStorage.getItem("todos")) || [];
let currentFilter = "all";

todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (text === "") return;

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

  let filteredTodos = todos;
  if (currentFilter === "completed")
    filteredTodos = todos.filter((t) => t.completed);
  else if (currentFilter === "pending")
    filteredTodos = todos.filter((t) => !t.completed);

  filteredTodos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.className = `todo-item ${todo.completed ? "completed" : ""}`;

    li.innerHTML = `
      <input type="checkbox" ${todo.completed ? "checked" : ""} />
      <span class="text" contenteditable="true">${todo.text}</span>
      <div class="actions">
        <button class="delete">🗑️</button>
      </div>
    `;

    const checkbox = li.querySelector("input");
    const deleteBtn = li.querySelector(".delete");
    const textSpan = li.querySelector(".text");

    checkbox.addEventListener("change", () => {
      todos[index].completed = checkbox.checked;
      saveAndRender();
    });

    deleteBtn.addEventListener("click", () => {
      todos.splice(index, 1);
      saveAndRender();
    });

    textSpan.addEventListener("blur", () => {
      todos[index].text = textSpan.textContent.trim();
      saveAndRender();
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

clearAll.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all tasks?")) {
    todos = [];
    saveAndRender();
  }
});

renderTodos();
