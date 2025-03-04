document.addEventListener("DOMContentLoaded", function () {
  lightGallery(document.getElementById("customize-thumbnails-gallery"), {
    // Додаємо клас для застосування стилю лише для цієї галереї
    addClass: "lg-custom-thumbnails",

    // Видаляємо стартові анімації
    animateThumb: false,

    // Налаштовуємо відображення мініатюр
    allowMediaOverlap: true,

    // Додаємо підтримку мініатюр
    appendThumbnailsTo: ".lg-outer",
  });
});
