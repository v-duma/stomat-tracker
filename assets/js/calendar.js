import {
  fetchDataByDate,
  addWorkingHours,
  calculateWorkDuration,
  calculateDailySalary,
} from "/assets/js/database.js";

document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  if (typeof FullCalendar === "undefined") {
    console.error(
      "FullCalendar не знайдено! Переконайтеся, що він підключений у index.html."
    );
    return;
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "uk",
    selectable: true,
    dateClick: async function (info) {
      const selectedDate = info.dateStr; // Формат ISO: "2025-02-06"
      document.getElementById(
        "selected-date-title"
      ).textContent = `${selectedDate.split("-").reverse().join(".")}`;

      // Отримуємо дані про обрану дату
      const data = await fetchDataByDate(selectedDate);
      const contentContainer = document.getElementById("date-info-content");

      if (data.length > 0) {
        // Відображення заповнених даних
        contentContainer.innerHTML = `<ul>${data
          .map(
            (d) =>
              `<li>
                <li><b>Час:</b> <span>${d.startTime} - ${d.endTime}</span><li>
                <li><b>Тривалість:</b> <span>${d.workDuration}</span><li>
                <li><b>Примітки:</b> <span>${d.notes || "Не вказано"}</span><li>
                <li><b>Сума:</b> <span>${
                  d.dailySalary || "Не розраховано"
                }</span></li>
                <li><b>Таймер:</b> <span id="timer-${
                  d.startTime
                }">${checkIfTimerNeeded(
                selectedDate,
                d.startTime,
                d.endTime
              )}</span>
              </li>`
          )
          .join("")}</ul>`;

        // Запускаємо таймер для всіх активних робіт
        data.forEach((d) => {
          if (isWorkActive(selectedDate, d.startTime, d.endTime)) {
            startRealTimeTimer(`timer-${d.startTime}`, selectedDate, d.endTime);
          }
        });
      } else {
        // Якщо дані не знайдено, відображаємо форму для введення
        contentContainer.innerHTML = `
          <p>Бубічок, ти ще не заповнив інфу на цей день🥲 виправ це!💙</p>
          <form id="add-new-data-form">
            <label>Час початку:</label>
            <div class="time-picker-wrapper">
            <input type="time" id="new-start-time" required><br>
            </div>
            <label>Час завершення:</label>
            <input type="time" id="new-end-time" required><br>
            <label>Примітки:</label>
            <textarea id="new-notes" placeholder="Що цікавого?"></textarea><br>
            <button type="submit">Додати</button>
          </form>
        `;

        // Додаємо обробник для форми
        document
          .getElementById("add-new-data-form")
          .addEventListener("submit", async (event) => {
            event.preventDefault();

            const newStartTime =
              document.getElementById("new-start-time").value;
            const newEndTime = document.getElementById("new-end-time").value;
            const newNotes = document.getElementById("new-notes").value;

            // Розраховуємо тривалість і заробітну плату
            const workDuration = calculateWorkDuration(
              newStartTime,
              newEndTime
            );
            const hourlyRate = 120; // Ви можете змінити ставку за годину
            const dailySalary = calculateDailySalary(workDuration, hourlyRate);

            // Додаємо новий запис до бази даних
            await addWorkingHours(
              selectedDate,
              newStartTime,
              newEndTime,
              workDuration,
              dailySalary,
              newNotes
            );

            alert("Дані успішно додано!");
            document.getElementById("date-info-modal").style.display = "none";
          });
      }

      // Відкриваємо модальне вікно
      document.getElementById("date-info-modal").style.display = "flex";
    },
  });

  calendar.render();
});

// Закриття модального вікна
document.querySelector(".close-modal").addEventListener("click", () => {
  document.getElementById("date-info-modal").style.display = "none";
});

// Таймер в реальному часі
function startRealTimeTimer(elementId, selectedDate, endTime) {
  const timerElement = document.getElementById(elementId);

  // Поєднуємо дату та час завершення
  const endDateTime = new Date(`${selectedDate}T${endTime}`);

  const interval = setInterval(() => {
    const now = new Date();
    const remainingTime = Math.max(0, endDateTime - now);

    if (remainingTime === 0) {
      timerElement.textContent = "Робота закінчилась";
      clearInterval(interval);
      return;
    }

    const remainingSeconds = Math.floor(remainingTime / 1000);
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    timerElement.textContent = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, 1000);
}

// Перевірка, чи робота активна
function isWorkActive(selectedDate, startTime, endTime) {
  const now = new Date();
  const startDateTime = new Date(`${selectedDate}T${startTime}`);
  const endDateTime = new Date(`${selectedDate}T${endTime}`);

  return now >= startDateTime && now <= endDateTime;
}

// Перевірка таймера при початку роботи
function checkIfTimerNeeded(selectedDate, startTime, endTime) {
  const now = new Date();
  const startDateTime = new Date(`${selectedDate}T${startTime}`);
  const endDateTime = new Date(`${selectedDate}T${endTime}`);

  if (now < startDateTime) {
    return "Ще не почалась";
  } else if (now > endDateTime) {
    return "Робота закінчилась";
  } else {
    return "Триває...";
  }
}

// Закриття модального вікна при натисканні на хрестик або поза модалкою
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("date-info-modal");
  const closeModal = document.querySelector(".close-modal");

  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});
