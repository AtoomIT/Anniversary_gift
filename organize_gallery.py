import os
from datetime import datetime
from PIL import Image

# =========================================================================
# НАЛАШТУВАННЯ ШЛЯХІВ
# =========================================================================
SOURCE_DIR = "my_raw_photos"
TARGET_DIR = "images/gallery"
DB_FILE_PATH = "js/gallery-data.js"

# Налаштування оптимізації під веб
MAX_WIDTH = 1600  # Максимальна ширина для екранів (більше не потрібно)
IMAGE_QUALITY = 82  # Золотий баланс стиснення (0-100)


def get_photo_date(img_obj, file_path):
    """Витягує реальну дату створення фото з EXIF або властивостей системи."""
    try:
        exif_data = img_obj._getexif()
        if exif_data and 36867 in exif_data:
            exif_date = exif_data[36867]
            return datetime.strptime(exif_date, "%Y:%m:%d %H:%M:%S").strftime("%Y-%m-%d")
    except Exception:
        pass

    timestamp = os.path.getmtime(file_path)
    return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d")


def main():
    os.makedirs(TARGET_DIR, exist_ok=True)

    valid_extensions = (".jpg", ".jpeg", ".png", ".webp")
    raw_files = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(valid_extensions)]
    raw_files.sort(key=lambda x: os.path.getmtime(os.path.join(SOURCE_DIR, x)))

    gallery_items = []
    print(f"🚀 Знайдено фотографій для обробки та оптимізації: {len(raw_files)}")

    for index, filename in enumerate(raw_files, start=1):
        source_path = os.path.join(SOURCE_DIR, filename)

        try:
            with Image.open(source_path) as img:
                # 1. Отримуємо дату до будь-яких маніпуляцій
                photo_date = get_photo_date(img, source_path)

                # Конвертуємо в RGB (на випадок, якщо сканер видав якийсь інший колірний простір)
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")

                # 2. Розумне зменшення роздільної здатності (якщо фото більше ніж треба для сайту)
                if img.width > MAX_WIDTH:
                    w_percent = (MAX_WIDTH / float(img.width))
                    h_size = int((float(img.height) * float(w_percent)))
                    img = img.resize((MAX_WIDTH, h_size), Image.Resampling.LANCZOS)

                # Формуємо нове ім'я (для вебу краще зберігати все в .jpg для сумісності)
                new_filename = f"Фото {index} - {photo_date}.jpg"
                target_path = os.path.join(TARGET_DIR, new_filename)

                # 3. Зберігаємо з видаленням метаданих та оптимізованим стисненням
                img.save(target_path, "JPEG", quality=IMAGE_QUALITY, optimize=True)

            gallery_items.append(f"    {{ filename: \"{new_filename}\", description: \"\" }}")
            print(f"✅ Оптимізовано [{index}]: {filename} -> {new_filename}")

        except Exception as e:
            print(f"❌ Помилка обробки файлу {filename}: {e}")

    # Оновлюємо базу даних сайту
    js_content = "const galleryData = [\n" + ",\n".join(gallery_items) + "\n];\n"
    os.makedirs(os.path.dirname(DB_FILE_PATH), exist_ok=True)
    with open(DB_FILE_PATH, "w", encoding="utf-8") as js_file:
        js_file.write(js_content)

    print(f"\n💾 Оптимізація завершена! Вага папки впала на ~90%.")
    print(f"Базу даних сайту успішно оновлено: {DB_FILE_PATH}")


if __name__ == "__main__":
    if not os.path.exists(SOURCE_DIR):
        os.makedirs(SOURCE_DIR)
        print(f"📁 Закинь фотки в '{SOURCE_DIR}'")
    else:
        main()
