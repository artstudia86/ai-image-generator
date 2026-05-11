'use strict';

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const OpenAI  = require('openai');

// ─────────────────────────────────────────────
// Конфигурация
// ─────────────────────────────────────────────

const PORT          = process.env.PORT          || 3001;
const IMAGE_MODEL   = process.env.IMAGE_MODEL   || 'dall-e-3';
const IMAGE_SIZE    = process.env.IMAGE_SIZE    || '1024x1024';
const IMAGE_QUALITY = process.env.IMAGE_QUALITY || 'standard';

// Допустимые размеры для валидации
const VALID_SIZES = {
    'dall-e-2': ['256x256', '512x512', '1024x1024'],
    'dall-e-3': ['1024x1024', '1792x1024', '1024x1792'],
};

// Проверяем наличие API-ключа при старте
if (!process.env.OPENAI_API_KEY) {
    console.error('[ERROR] OPENAI_API_KEY не задан в .env файле!');
    process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app    = express();

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ─────────────────────────────────────────────
// Маршруты
// ─────────────────────────────────────────────

/**
 * GET /health
 * Проверка работоспособности + возвращает доступные опции.
 */
app.get('/health', (req, res) => {
    res.json({
        status:  'ok',
        model:   IMAGE_MODEL,
        size:    IMAGE_SIZE,
        quality: IMAGE_QUALITY,
        validSizes: VALID_SIZES,
    });
});

/**
 * POST /generate
 * Генерирует изображение через OpenAI DALL-E API.
 *
 * Тело запроса (JSON):
 *   {
 *     "prompt":  string,  — описание картинки (обязательно)
 *     "size":    string,  — размер (опционально, дефолт из .env)
 *     "quality": string,  — "standard" или "hd" (только dall-e-3)
 *     "style":   string   — "vivid" или "natural" (только dall-e-3)
 *   }
 *
 * Ответ:
 *   {
 *     "url":            string,  — прямая ссылка на картинку (1 час)
 *     "revised_prompt": string   — переработанный промпт от OpenAI
 *   }
 */
app.post('/generate', async (req, res) => {
    const {
        prompt,
        size    = IMAGE_SIZE,
        quality = IMAGE_QUALITY,
        style   = 'vivid',
    } = req.body;

    // Валидация промпта
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({
            error: 'Поле "prompt" обязательно и не может быть пустым.'
        });
    }

    if (prompt.trim().length > 4000) {
        return res.status(400).json({
            error: 'Описание слишком длинное. Максимум 4000 символов.'
        });
    }

    // Валидация размера
    const validSizesForModel = VALID_SIZES[IMAGE_MODEL] || VALID_SIZES['dall-e-3'];
    if (!validSizesForModel.includes(size)) {
        return res.status(400).json({
            error: `Недопустимый размер "${size}" для модели ${IMAGE_MODEL}. Допустимые: ${validSizesForModel.join(', ')}`
        });
    }

    console.log(`[generate] model=${IMAGE_MODEL} size=${size} quality=${quality} style=${style}`);
    console.log(`[generate] prompt="${prompt.slice(0, 100)}..."`);

    try {
        // Параметры запроса к DALL-E
        const params = {
            model:   IMAGE_MODEL,
            prompt:  prompt.trim(),
            n:       1,             // Количество картинок (dall-e-3 поддерживает только 1)
            size:    size,
            response_format: 'url', // Возвращаем URL, а не base64
        };

        // Параметры только для dall-e-3
        if (IMAGE_MODEL === 'dall-e-3') {
            params.quality = quality;  // 'standard' или 'hd'
            params.style   = style;    // 'vivid' (яркий) или 'natural' (естественный)
        }

        const response = await openai.images.generate(params);

        const imageUrl      = response.data[0]?.url;
        const revisedPrompt = response.data[0]?.revised_prompt || prompt;

        if (!imageUrl) {
            throw new Error('OpenAI не вернул URL изображения');
        }

        console.log(`[generate] Успешно: ${imageUrl.slice(0, 60)}...`);

        return res.json({
            url:            imageUrl,
            revised_prompt: revisedPrompt,
        });

    } catch (err) {
        console.error('[generate] Ошибка OpenAI:', err.message);

        if (err.status === 401) {
            return res.status(500).json({ error: 'Неверный API-ключ OpenAI.' });
        }
        if (err.status === 429) {
            return res.status(429).json({ error: 'Превышен лимит запросов OpenAI. Попробуйте через минуту.' });
        }
        if (err.status === 400) {
            // Контентная политика OpenAI
            return res.status(400).json({
                error: 'Запрос нарушает политику контента OpenAI. Измените описание.'
            });
        }
        if (err.status === 503) {
            return res.status(503).json({ error: 'Сервис OpenAI временно недоступен. Попробуйте позже.' });
        }

        return res.status(500).json({ error: 'Ошибка генерации изображения. Попробуйте снова.' });
    }
});

// ─────────────────────────────────────────────
// Запуск сервера
// ─────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`[server] AI Image Generator запущен на http://localhost:${PORT}`);
    console.log(`[server] Модель: ${IMAGE_MODEL} | Размер: ${IMAGE_SIZE} | Качество: ${IMAGE_QUALITY}`);
});
