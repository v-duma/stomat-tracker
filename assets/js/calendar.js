import {
  fetchDataByDate,
  addWorkingHours,
  calculateWorkDuration,
  calculateDailySalary,
  fetchStatistics,
  calculateStatistics,
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
    firstDay: 1,
    showNonCurrentDates: false,
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
// Закриття модального вікна по хрестику або кліку поза ним
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("details-modal");
  const closeModal = modal.querySelector(".close-modal");

  if (closeModal) {
    closeModal.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});

// Функція для отримання діапазону дат на основі вибраного періоду
function getDateRange(period) {
  const now = new Date(); // Отримуємо поточну дату
  const dayOfWeek = now.getDay(); // Отримуємо день тижня (0 - неділя, 1 - понеділок, ...)

  let startDate, endDate;

  if (period === "week") {
    // Якщо сьогодні неділя (dayOfWeek === 0), то понеділок має бути 6 днів тому
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Рахуємо кількість днів до понеділка

    // Створюємо нові об'єкти для понеділка і неділі поточного тижня
    startDate = new Date(now);
    startDate.setDate(now.getDate() - diffToMonday); // Понеділок поточного тижня
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Неділя поточного тижня
  } else if (period === "month") {
    // Початок місяця (1 число поточного місяця)
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    // Визначаємо останній день поточного місяця
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (period === "year") {
    startDate = new Date(now.getFullYear(), 0, 1); // Початок року
    endDate = new Date(now.getFullYear(), 11, 31); // Кінець року
  }

  // Вибір власного періоду
  if (period === "custom") {
    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;

    // Перевірка правильності дат
    if (!start || !end) {
      return { startDate: null, endDate: null }; // Повертаємо null, якщо дата не введена
    }

    startDate = new Date(start);
    endDate = new Date(end);

    // Перевірка на валідність дат
    if (isNaN(startDate) || isNaN(endDate)) {
      return { startDate: null, endDate: null }; // Якщо дати некоректні
    }
  }

  return {
    startDate:
      startDate instanceof Date
        ? startDate.toISOString().split("T")[0]
        : startDate,
    endDate:
      endDate instanceof Date ? endDate.toISOString().split("T")[0] : endDate,
  };
}

// Обробник для вибору періоду
document
  .getElementById("period-select")
  .addEventListener("change", function () {
    const period = this.value;
    const { startDate, endDate } = getDateRange(period);

    // Якщо вибрано "Власний період", показуємо поля для введення дат
    if (period === "custom") {
      document.getElementById("custom-period").style.display = "block";
    } else {
      document.getElementById("custom-period").style.display = "none";
    }

    // Спочатку не показуємо статистику, якщо не вибрано період
    if (period === "") {
      hideStatistics();
      return;
    }

    // Відображаємо статистику для обраного періоду
    updateStatistics(startDate, endDate);
  });

// Обробка кліку на кнопку "Дізнатися" для власного періоду
// Обробка кліку на кнопку "Дізнатися" для власного періоду
document
  .getElementById("get-statistics")
  .addEventListener("click", function () {
    const startDateInput = document.getElementById("start-date").value;
    const endDateInput = document.getElementById("end-date").value;

    // Перевірка на порожні значення
    if (!startDateInput || !endDateInput) {
      alert("Будь ласка, введіть обидві дати.");
      return;
    }

    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);

    // Перевірка на валідність дат
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      alert("Введено некоректну дату.");
      console.error("Некоректні дати:", startDateInput, endDateInput);
      return;
    }

    // Перевірка, що дата завершення не передує даті початку
    if (endDate < startDate) {
      alert("Дата завершення не може бути раніше дати початку!");
      console.error("Дата завершення раніше дати початку:", startDate, endDate);
      return;
    }

    // Передаємо коректні дати у форматі YYYY-MM-DD
    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];

    console.log(
      "📊 Оновлення статистики з",
      formattedStartDate,
      "по",
      formattedEndDate
    );
    updateStatistics(formattedStartDate, formattedEndDate);
  });

// Функція для форматування часу у формат "X год Y хв"
function formatTime(hours) {
  const h = Math.floor(hours); // Отримуємо години
  const m = Math.round((hours - h) * 60); // Отримуємо хвилини

  return `${h} год ${m} хв`;
}

// Функція для оновлення статистики
async function updateStatistics(startDate, endDate) {
  if (
    !startDate ||
    !endDate ||
    isNaN(new Date(startDate)) ||
    isNaN(new Date(endDate))
  ) {
    console.error("Некоректні дати: ", startDate, endDate);
    return;
  }

  const records = await fetchStatistics(startDate, endDate);

  const stats = calculateStatistics(records);

  // Показуємо статистику
  document.getElementById("total-hours").style.display = "block";
  document.getElementById("total-salary").style.display = "block";
  document.getElementById("max-hours").style.display = "block";
  document.getElementById("min-hours").style.display = "block";
  document.getElementById("max-salary").style.display = "block";
  document.getElementById("min-salary").style.display = "block";

  // Використовуємо formatTime для форматування часу
  document.getElementById(
    "total-hours"
  ).textContent = `Загальна кількість годин: ${formatTime(stats.totalHours)}`;
  document.getElementById(
    "total-salary"
  ).textContent = `Загальна зарплата: ${stats.totalSalary.toFixed(2)} грн`;
  document.getElementById(
    "max-hours"
  ).textContent = `Максимальна кількість годин у день: ${formatTime(
    stats.maxHours
  )}`;
  document.getElementById(
    "min-hours"
  ).textContent = `Мінімальна кількість годин у день: ${formatTime(
    stats.minHours
  )}`;
  document.getElementById(
    "max-salary"
  ).textContent = `Максимальна зарплата за день: ${stats.maxSalary.toFixed(
    2
  )} грн`;
  document.getElementById(
    "min-salary"
  ).textContent = `Мінімальна зарплата за день: ${stats.minSalary.toFixed(
    2
  )} грн`;

  // Показуємо кнопку для відкриття модального вікна
  document.getElementById("view-daily-statistics").style.display = "inline";
}
document
  .getElementById("view-daily-statistics")
  .addEventListener("click", async () => {
    const { startDate, endDate } = getDateRange(
      document.getElementById("period-select").value
    );

    // Відкриваємо модальне вікно зі статистикою по днях
    openStatisticsModal(startDate, endDate);
  });

// Функція для приховування статистики
function hideStatistics() {
  document.getElementById("total-hours").style.display = "none";
  document.getElementById("total-salary").style.display = "none";
  document.getElementById("max-hours").style.display = "none";
  document.getElementById("min-hours").style.display = "none";
  document.getElementById("max-salary").style.display = "none";
  document.getElementById("min-salary").style.display = "none";
}

// Додати виклик updateStatistics в обробник вибору періоду (як показано раніше)
document
  .getElementById("period-select")
  .addEventListener("change", function () {
    const period = this.value;
    const { startDate, endDate } = getDateRange(period);

    // Відображаємо дані для вибраного періоду
    updateStatistics(startDate, endDate);

    // Показуємо/ховаємо поля для власного періоду
    if (period === "custom") {
      document.getElementById("custom-period").style.display = "block";
    } else {
      document.getElementById("custom-period").style.display = "none";
    }
  });

async function openStatisticsModal(startDate, endDate) {
  // Показуємо прелоадер перед запитом
  document.getElementById("loading-overlay").style.display = "flex";

  try {
    const { allRecords, totalSalary } = await fetchAllDaysStatistics(
      startDate,
      endDate
    );

    let detailsContent = "<ul>";

    if (allRecords.length > 0) {
      allRecords.forEach((record) => {
        detailsContent += `<li><b>${record.date}</b> <span>${record.startTime} - ${record.endTime}</span></li>`;
      });

      detailsContent += `<li><b>Загальна ЗП:</b> <span>${totalSalary.toFixed(
        2
      )} грн</span></li>`;
    } else {
      detailsContent = "<p>Бубічок, ти проїбланив цей час і ноу мані 😢</p>";
    }

    document.getElementById("daily-details-content").innerHTML = detailsContent;
    document.getElementById("details-modal").style.display = "flex";
  } catch (error) {
    console.error("❌ Помилка завантаження даних:", error);
    document.getElementById("daily-details-content").innerHTML =
      "<p>Сталася помилка при отриманні даних.</p>";
  } finally {
    // Ховаємо прелоадер після завершення запиту
    document.getElementById("loading-overlay").style.display = "none";
  }
}

// Функція для отримання всіх записів по днях за вибраний період
async function fetchAllDaysStatistics(startDate, endDate) {
  const allRecords = [];
  let totalSalary = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= new Date(endDate)) {
    const dateStr = currentDate.toISOString().split("T")[0]; // Формат YYYY-MM-DD

    // Форматуємо дату у DD.MM.YYYY
    const formattedDate = dateStr.split("-").reverse().join(".");

    console.log("📅 Отримуємо дані для:", formattedDate);

    const records = await fetchStatisticsByDate(dateStr);
    console.log("📌 Отримані записи для", formattedDate, ":", records);

    records.forEach((record) => {
      let recordDate = record.date;
      if (typeof record.date !== "string") {
        console.warn("⚠ `record.date` не є рядком. Конвертуємо...");
        recordDate = record.date.toDate().toISOString().split("T")[0];
      }

      // Конвертуємо дату у потрібний формат
      const formattedRecordDate = recordDate.split("-").reverse().join(".");

      allRecords.push({
        date: formattedRecordDate,
        startTime: record.startTime || "—",
        endTime: record.endTime || "—",
        salary: record.dailySalary || "0 грн",
      });

      totalSalary += parseFloat(record.dailySalary.replace(" грн", "")) || 0;
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log("📊 Фінальні дані для модального вікна:", allRecords);
  return { allRecords, totalSalary };
}

// Функція для отримання даних по конкретній даті
async function fetchStatisticsByDate(date) {
  const data = await fetchDataByDate(date);
  console.log("Data fetched for", date, ":", data); // Лог отриманих даних
  return data;
}
