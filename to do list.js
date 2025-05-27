  const todoForm = document.querySelector("form");
  const todoInput = document.getElementById("todoinput");
  const todoListUl = document.getElementById("todolist");

  let allTodos = JSON.parse(localStorage.getItem("todos")) || [];

  updateTodoList();

  todoForm.addEventListener("submit", function(e) {
      e.preventDefault();
      addTodo();
  });

  function addTodo() {
      const todoText = todoInput.value.trim();
      if (todoText.length > 0) {
          allTodos.push(todoText);
          saveTodos();
          todoInput.value = "";
          updateTodoList();
      }
  }

  function saveTodos() {
      localStorage.setItem("todos", JSON.stringify(allTodos));
  }

  function updateTodoList() {
      todoListUl.innerHTML = "";
      allTodos.forEach((todo, index) => {
          const todoItem = createTodoItem(todo, index);
          todoListUl.appendChild(todoItem);
      });
  }

  function createTodoItem(todo, index) {
      const li = document.createElement("li");
      li.id = "todo";
      li.innerHTML = `
          <input type="checkbox" id="todo-${index}">
          <label for="todo-${index}" class="checkbox">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                 viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.41 1.41L9 19 21 7l-1.41-1.41z" fill="black"/>
            </svg>
          </label>
          <label for="todo-${index}" class="todotext">${todo}</label>
          <button class="delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                 viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm3-9h2v6H9zm4 0h2v6h-2zM5 5h14l-1-1H6L5 5z" fill="red"/>
            </svg>
          </button>
        `;

      const deleteBtn = li.querySelector(".delete");
      deleteBtn.addEventListener("click", () => {
          allTodos.splice(index, 1);
          saveTodos();
          updateTodoList();
      });

      return li;
  }