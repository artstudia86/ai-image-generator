# ai-image-generator
🎨 AI Image Generator Widget
JS-виджет для встраивания на любой сайт. Генерирует изображения с помощью OpenAI DALL-E 3.

Как это работает
Пользователь вводит описание

↓

widget.js → POST /generate → backend/server.js

↓

server.js → OpenAI DALL-E 3 API

↓

URL картинки → виджет → отображается на странице

Структура проекта
ai-image-generator/

├── backend/

│ ├── server.js ← Express-сервер, запросы к DALL-E

│ ├── package.json

│ └── .env ← API-ключ

├── widget/

│ └── widget.js ← Встраиваемый JS-виджет

├── demo/

│ └── index.html ← Демо-страница

└── README.md

Быстрый старт
1. Установка зависимостей
cd backend
npm install
2. Настройка .env
OPENAI_API_KEY=sk-ВАШ_КЛЮЧ_ЗДЕСЬ
IMAGE_MODEL=dall-e-3
IMAGE_SIZE=1024x1024
IMAGE_QUALITY=standard
PORT=3001
Получить ключ: https://platform.openai.com/api-keys

3. Запуск backend
node server.js
# или для разработки:
npm run dev
Проверка:

curl http://localhost:3001/health
4. Открыть демо
Открой demo/index.html в браузере.

Встраивание на сайт
<div id="ai-image-widget"></div>
<script src="путь/до/widget.js" data-api="https://ваш-backend.ru"></script>
Параметры DALL-E 3
Параметр	Значения	По умолчанию
IMAGE_MODEL	dall-e-3, dall-e-2	dall-e-3
IMAGE_SIZE	1024x1024, 1792x1024, 1024x1792	1024x1024
IMAGE_QUALITY	standard, hd	standard
style	vivid, natural	vivid
hd — более детализированное изображение, стоит в 2× дороже.

Цены OpenAI (DALL-E 3, май 2026)
Качество	Размер	Цена
standard	1024×1024	~$0.04 за картинку
standard	1792×1024 / 1024×1792	~$0.08
hd	1024×1024	~$0.08
hd	1792×1024 / 1024×1792	~$0.12
.gitignore
backend/.env

backend/node_modules/

Автор
artstudia86 — github.com/artstudia86
