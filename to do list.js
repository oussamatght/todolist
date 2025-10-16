const input = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("todo-list");
const clearBtn = document.getElementById("clear-btn");
const taskInfo = document.getElementById("task-info");

let todos = JSON.parse(localStorage.getItem("todos")) || [];

function updateLocalStorage() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function renderTodos() {
    list.innerHTML = "";
    todos.forEach((todo, index) => {
        const li = document.createElement("li");
        li.classList.add("todo-item");

        const span = document.createElement("span");
        span.classList.add("todo-text");
        if (todo.completed) span.classList.add("completed");
        span.textContent = todo.text;

        span.addEventListener("click", () => {
            todos[index].completed = !todos[index].completed;
            updateLocalStorage();
            renderTodos();
        });

        const del = document.createElement("button");
        del.textContent = "🗑";
        del.classList.add("delete-btn");
        del.addEventListener("click", () => {
            todos.splice(index, 1);
            updateLocalStorage();
            renderTodos();
        });

        li.appendChild(span);
        li.appendChild(del);
        list.appendChild(li);
    });

    const pending = todos.filter((t) => !t.completed).length;
    taskInfo.textContent = `You have ${pending} pending task${pending !== 1 ? "s" : ""}`;
}

addBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text, completed: false });
    input.value = "";
    updateLocalStorage();
    renderTodos();
});

clearBtn.addEventListener("click", () => {
    if (todos.length === 0) return;
    if (confirm("Clear all tasks?")) {
        todos = [];
        updateLocalStorage();
        renderTodos();
    }
});

input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addBtn.click();
});

renderTodos();
