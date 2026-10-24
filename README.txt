2108 FITWEAR — магазин + админ-панель

SETUP:
1. Создай проект Supabase.
2. SQL Editor -> вставь supabase.sql -> Run.
3. Authentication -> Users -> Add user: создай email/пароль владельца магазина.
4. Project Settings -> API: скопируй Project URL и anon/public key в supabase-config.js.
5. Загрузи весь проект на GitHub Pages.
6. Магазин: / 
7. Админка: /admin/

Важно: service_role key нельзя помещать в HTML/JS.

Заказчик сможет сам: добавлять товары, менять цену/описание/категорию/размеры, загружать несколько фото, скрывать и удалять товары. Магазин получает каталог из Supabase автоматически.

Перед публикацией замени WHATSAPP в script.js на реальный номер заказчика.
