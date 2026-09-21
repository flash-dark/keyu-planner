const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const STORAGE_KEY = "keyu-todos-v1";

const SAMPLE_COURSES = [
  { id: "c1", weekday: 1, start: "10:10", end: "12:00", name: "互联网软件", place: "理科一号楼 113", note: "示例课程" },
  { id: "c2", weekday: 2, start: "13:00", end: "14:50", name: "学术写作工作坊", place: "图书馆研讨间 B", note: "示例课程" },
  { id: "c3", weekday: 3, start: "08:00", end: "09:50", name: "科研伦理导论", place: "二教 401", note: "示例课程" },
  { id: "c4", weekday: 4, start: "15:10", end: "17:00", name: "开源实践讨论", place: "理科教学楼 207", note: "示例课程" },
  { id: "c5", weekday: 5, start: "10:10", end: "12:00", name: "互联网软件", place: "理科一号楼 113", note: "示例课程" },
];

const SAMPLE_TODOS = [
  { id: "t1", title: "把课后小项目推到 GitHub", tag: "作业", due: todayISO(2), done: false },
  { id: "t2", title: "预习周五讨论材料", tag: "课程", due: todayISO(1), done: false },
  { id: "t3", title: "去未名湖边走一圈", tag: "生活", due: todayISO(0), done: true },
];

const state = {
  tab: "today",
  filter: "all",
  weekday: "all",
  todos: loadTodos(),
};

function todayISO(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_TODOS.map((item) => ({ ...item }));
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SAMPLE_TODOS.map((item) => ({ ...item }));
  } catch {
    return SAMPLE_TODOS.map((item) => ({ ...item }));
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function weekdayOf(date = new Date()) {
  return date.getDay();
}

function coursesOn(weekday) {
  return SAMPLE_COURSES.filter((course) => course.weekday === weekday).sort((a, b) => a.start.localeCompare(b.start));
}

function openTodos() {
  return state.todos.filter((todo) => !todo.done);
}

function renderStats() {
  const todayCourses = coursesOn(weekdayOf());
  document.getElementById("stats").innerHTML = `
    <div class="stat"><b>${todayCourses.length}</b><span>今日课程</span></div>
    <div class="stat"><b>${openTodos().length}</b><span>未完成待办</span></div>
    <div class="stat"><b>${state.todos.filter((todo) => todo.done).length}</b><span>已经做完</span></div>
  `;
}

function courseItem(course) {
  return `
    <li class="course-item">
      <strong>${escapeHtml(course.name)}</strong>
      <div class="meta">${course.start}–${course.end} · ${escapeHtml(course.place)}</div>
      <span class="tag">${escapeHtml(course.note)}</span>
    </li>
  `;
}

function todoItem(todo) {
  return `
    <li class="todo-item ${todo.done ? "is-done" : ""}" data-id="${todo.id}">
      <input type="checkbox" ${todo.done ? "checked" : ""} aria-label="完成 ${escapeHtml(todo.title)}" />
      <div>
        <strong>${escapeHtml(todo.title)}</strong>
        <div class="meta">${todo.due ? `截止 ${todo.due}` : "没有截止日期"}</div>
        <span class="tag">${escapeHtml(todo.tag)}</span>
      </div>
      <button type="button" data-delete="${todo.id}">删除</button>
    </li>
  `;
}

function empty(text) {
  return `<li class="empty">${text}</li>`;
}

function renderToday() {
  const today = new Date();
  document.getElementById("today-date").textContent =
    `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 · ${WEEKDAYS[today.getDay()]}`;

  const courses = coursesOn(weekdayOf(today));
  document.getElementById("today-courses").innerHTML = courses.length
    ? courses.map(courseItem).join("")
    : empty("今天没有示例课程，适合把待办清一清。");

  const todos = openTodos();
  document.getElementById("today-todos").innerHTML = todos.length
    ? todos.map(todoItem).join("")
    : empty("待办都做完了。");
}

function renderSchedule() {
  const selected = state.weekday;
  const days = selected === "all" ? [1, 2, 3, 4, 5, 6, 0] : [Number(selected)];
  document.getElementById("timetable").innerHTML = days
    .map((day) => {
      const courses = coursesOn(day);
      return `
        <section class="day-block">
          <h3>${WEEKDAYS[day]}</h3>
          <ul class="course-list">
            ${courses.length ? courses.map(courseItem).join("") : empty("这一天没有示例课程。")}
          </ul>
        </section>
      `;
    })
    .join("");
}

function matchesFilter(todo) {
  if (state.filter === "all") return true;
  if (state.filter === "open") return !todo.done;
  if (state.filter === "done") return todo.done;
  return todo.tag === state.filter;
}

function renderTodos() {
  const todos = state.todos.filter(matchesFilter);
  document.getElementById("todo-list").innerHTML = todos.length
    ? todos.map(todoItem).join("")
    : empty("没有符合筛选的事项。");
}

function render() {
  renderStats();
  renderToday();
  renderSchedule();
  renderTodos();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tab);
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    const active = panel.id === `panel-${tab}`;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  });
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

document.getElementById("weekday-filter").addEventListener("change", (event) => {
  state.weekday = event.target.value;
  renderSchedule();
});

document.getElementById("todo-filters").addEventListener("click", (event) => {
  const chip = event.target.closest("[data-filter]");
  if (!chip) return;
  state.filter = chip.dataset.filter;
  document.querySelectorAll("#todo-filters .chip").forEach((item) => {
    item.classList.toggle("is-on", item === chip);
  });
  renderTodos();
});

document.getElementById("todo-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.getElementById("todo-title").value.trim();
  if (!title) return;
  state.todos.unshift({
    id: `t-${Date.now()}`,
    title,
    tag: document.getElementById("todo-tag").value,
    due: document.getElementById("todo-due").value,
    done: false,
  });
  event.target.reset();
  saveTodos();
  render();
});

document.addEventListener("change", (event) => {
  const item = event.target.closest(".todo-item");
  if (!item || event.target.type !== "checkbox") return;
  const todo = state.todos.find((entry) => entry.id === item.dataset.id);
  if (!todo) return;
  todo.done = event.target.checked;
  saveTodos();
  render();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  state.todos = state.todos.filter((todo) => todo.id !== button.dataset.delete);
  saveTodos();
  render();
});

document.getElementById("todo-due").value = todayISO(0);
render();
