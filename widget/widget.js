/**
 * AI Image Generator Widget
 * ─────────────────────────────────────────────
 * Подключение на сайт:
 *   <div id="ai-image-widget"></div>
 *   <script src="widget.js" data-api="http://localhost:3001"></script>
 */

(function () {
    'use strict';

    // ──────────────────────────────────────────
    // Конфигурация
    // ──────────────────────────────────────────

    const scriptTag  = document.currentScript;
    const API_BASE   = (scriptTag && scriptTag.getAttribute('data-api'))
        ? scriptTag.getAttribute('data-api').replace(/\/$/, '')
        : 'http://localhost:3001';

    const CONTAINER_ID = 'ai-image-widget';

    // Системный промпт по умолчанию (подсказка-обогатитель промпта)
    const DEFAULT_STYLE_PROMPT =
        'Photorealistic, high quality, 8K, detailed lighting, sharp focus';

    // Варианты размеров для DALL-E 3
    const SIZE_OPTIONS = [
        { value: '1024x1024', label: '1:1 — Квадрат (1024×1024)'      },
        { value: '1792x1024', label: '16:9 — Пейзаж (1792×1024)'      },
        { value: '1024x1792', label: '9:16 — Портрет (1024×1792)'     },
    ];

    // ──────────────────────────────────────────
    // Стили виджета
    // ──────────────────────────────────────────

    const STYLES = `
        .aig-widget {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 580px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.07);
            box-sizing: border-box;
        }
        .aig-widget * { box-sizing: border-box; }
        .aig-title {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 20px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .aig-title span { font-size: 22px; }
        .aig-label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
        }
        .aig-textarea, .aig-select, .aig-style-input {
            width: 100%;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 14px;
            color: #111827;
            background: #f9fafb;
            transition: border-color 0.2s, box-shadow 0.2s;
            outline: none;
        }
        .aig-textarea:focus, .aig-select:focus, .aig-style-input:focus {
            border-color: #8b5cf6;
            box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
            background: #fff;
        }
        .aig-textarea {
            resize: vertical;
            min-height: 90px;
            margin-bottom: 14px;
        }
        .aig-style-input { margin-bottom: 6px; }
        .aig-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }
        .aig-field { display: flex; flex-direction: column; }
        .aig-select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
            padding-right: 32px;
            cursor: pointer;
        }
        .aig-style-toggle {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #6b7280;
            cursor: pointer;
            background: none;
            border: none;
            padding: 0;
            margin-bottom: 16px;
            user-select: none;
        }
        .aig-style-toggle:hover { color: #7c3aed; }
        .aig-style-block { margin-bottom: 16px; }
        .aig-style-block.hidden { display: none; }
        .aig-style-hint {
            font-size: 11px;
            color: #9ca3af;
            margin-top: 4px;
            margin-bottom: 0;
        }
        .aig-btn {
            width: 100%;
            padding: 12px;
            background: #7c3aed;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, opacity 0.2s;
        }
        .aig-btn:hover:not(:disabled) { background: #6d28d9; }
        .aig-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .aig-error {
            margin-top: 12px;
            padding: 10px 14px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            font-size: 13px;
            color: #dc2626;
            display: none;
        }
        .aig-error.visible { display: block; }
        .aig-result {
            margin-top: 20px;
            display: none;
        }
        .aig-result.visible { display: block; }
        .aig-result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .aig-result-label {
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .aig-actions {
            display: flex;
            gap: 6px;
        }
        .aig-action-btn {
            font-size: 12px;
            color: #7c3aed;
            background: none;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 4px 10px;
            cursor: pointer;
            transition: background 0.15s;
            text-decoration: none;
        }
        .aig-action-btn:hover { background: #f5f3ff; }
        .aig-image-wrap {
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            background: #f3f4f6;
            line-height: 0;
        }
        .aig-image {
            width: 100%;
            height: auto;
            display: block;
        }
        .aig-revised {
            margin-top: 10px;
            padding: 10px 14px;
            background: #f5f3ff;
            border: 1px solid #ede9fe;
            border-radius: 8px;
        }
        .aig-revised-label {
            font-size: 11px;
            font-weight: 600;
            color: #7c3aed;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }
        .aig-revised-text {
            font-size: 12px;
            color: #4b5563;
            line-height: 1.5;
        }
        .aig-loader {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.4);
            border-top-color: #fff;
            border-radius: 50%;
            animation: aig-spin 0.7s linear infinite;
            vertical-align: middle;
            margin-right: 6px;
        }
        .aig-skeleton {
            width: 100%;
            aspect-ratio: 1 / 1;
            border-radius: 10px;
            background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
            background-size: 200% 100%;
            animation: aig-shimmer 1.5s ease-in-out infinite;
        }
        @keyframes aig-spin    { to { transform: rotate(360deg); } }
        @keyframes aig-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    `;

    // ──────────────────────────────────────────
    // HTML виджета
    // ──────────────────────────────────────────

    function buildSizeOptions() {
        return SIZE_OPTIONS.map(function (opt) {
            return `<option value="${opt.value}">${opt.label}</option>`;
        }).join('');
    }

    const TEMPLATE = `
        <div class="aig-widget">
            <h2 class="aig-title">
                <span>🎨</span> AI Генератор изображений
            </h2>

            <!-- Описание картинки -->
            <label class="aig-label" for="aig-prompt">Описание изображения</label>
            <textarea
                class="aig-textarea"
                id="aig-prompt"
                placeholder="Например: котёнок в скафандре на Луне, звёздное небо на заднем плане, кинематографическое освещение"
                maxlength="4000"
            ></textarea>

            <!-- Размер и стиль -->
            <div class="aig-row">
                <div class="aig-field">
                    <label class="aig-label" for="aig-size">Размер</label>
                    <select class="aig-select" id="aig-size">
                        ${buildSizeOptions()}
                    </select>
                </div>
                <div class="aig-field">
                    <label class="aig-label" for="aig-style-sel">Стиль</label>
                    <select class="aig-select" id="aig-style-sel">
                        <option value="vivid">Vivid — яркий, насыщенный</option>
                        <option value="natural">Natural — реалистичный</option>
                    </select>
                </div>
            </div>

            <!-- Дополнительный промпт стиля (сворачивается) -->
            <button class="aig-style-toggle" id="aig-toggle-style" type="button">
                <span id="aig-toggle-icon">▶</span>
                Дополнительный стиль / суффикс промпта
            </button>

            <div class="aig-style-block hidden" id="aig-style-block">
                <label class="aig-label" for="aig-style-prompt">Суффикс промпта</label>
                <input
                    class="aig-style-input"
                    type="text"
                    id="aig-style-prompt"
                    placeholder="Например: oil painting, cinematic, bokeh..."
                />
                <p class="aig-style-hint">
                    Добавляется в конец промпта. Используй для задания техники, художника, атмосферы.
                </p>
            </div>

            <!-- Кнопка генерации -->
            <button class="aig-btn" id="aig-generate-btn" type="button">
                Сгенерировать изображение
            </button>

            <!-- Блок ошибки -->
            <div class="aig-error" id="aig-error"></div>

            <!-- Результат -->
            <div class="aig-result" id="aig-result">
                <div class="aig-result-header">
                    <span class="aig-result-label">Результат</span>
                    <div class="aig-actions">
                        <a class="aig-action-btn" id="aig-download-btn" href="#" download="ai-image.png">
                            ↓ Скачать
                        </a>
                        <button class="aig-action-btn" id="aig-regen-btn" type="button">
                            ↺ Ещё раз
                        </button>
                    </div>
                </div>

                <!-- Скелетон — показывается пока грузится картинка -->
                <div class="aig-skeleton" id="aig-skeleton"></div>

                <!-- Само изображение -->
                <div class="aig-image-wrap" id="aig-image-wrap" style="display:none;">
                    <img class="aig-image" id="aig-image" src="" alt="Сгенерированное изображение" />
                </div>

                <!-- Переработанный промпт от OpenAI -->
                <div class="aig-revised" id="aig-revised" style="display:none;">
                    <div class="aig-revised-label">Промпт после обработки OpenAI</div>
                    <div class="aig-revised-text" id="aig-revised-text"></div>
                </div>
            </div>
        </div>
    `;

    // ──────────────────────────────────────────
    // Инициализация виджета
    // ──────────────────────────────────────────

    function init() {
        const container = document.getElementById(CONTAINER_ID);
        if (!container) {
            console.warn('[AI Image Widget] Контейнер #' + CONTAINER_ID + ' не найден.');
            return;
        }

        // Вставляем стили
        const styleEl = document.createElement('style');
        styleEl.textContent = STYLES;
        document.head.appendChild(styleEl);

        // Вставляем HTML
        container.innerHTML = TEMPLATE;

        // DOM-элементы
        const promptInput   = document.getElementById('aig-prompt');
        const sizeSelect    = document.getElementById('aig-size');
        const styleSelect   = document.getElementById('aig-style-sel');
        const toggleBtn     = document.getElementById('aig-toggle-style');
        const toggleIcon    = document.getElementById('aig-toggle-icon');
        const styleBlock    = document.getElementById('aig-style-block');
        const stylePrompt   = document.getElementById('aig-style-prompt');
        const generateBtn   = document.getElementById('aig-generate-btn');
        const resultBlock   = document.getElementById('aig-result');
        const skeleton      = document.getElementById('aig-skeleton');
        const imageWrap     = document.getElementById('aig-image-wrap');
        const imageEl       = document.getElementById('aig-image');
        const errorBlock    = document.getElementById('aig-error');
        const downloadBtn   = document.getElementById('aig-download-btn');
        const regenBtn      = document.getElementById('aig-regen-btn');
        const revisedBlock  = document.getElementById('aig-revised');
        const revisedText   = document.getElementById('aig-revised-text');

        // Дефолтный суффикс стиля
        stylePrompt.value = DEFAULT_STYLE_PROMPT;

        // ── Переключение блока стиля ──
        toggleBtn.addEventListener('click', function () {
            const isHidden = styleBlock.classList.contains('hidden');
            styleBlock.classList.toggle('hidden');
            toggleIcon.textContent = isHidden ? '▼' : '▶';
        });

        // ── Кнопка "Ещё раз" — повторяет последний запрос ──
        regenBtn.addEventListener('click', function () {
            generateImage();
        });

        // ── Кнопка генерации ──
        generateBtn.addEventListener('click', function () {
            generateImage();
        });

        // ── Ctrl+Enter для генерации ──
        promptInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && e.ctrlKey) generateImage();
        });

        /**
         * Основная функция генерации изображения.
         */
        function generateImage() {
            const prompt = promptInput.value.trim();
            const suffix = stylePrompt.value.trim();
            const size   = sizeSelect.value;
            const style  = styleSelect.value;

            // Клиентская валидация
            if (!prompt) {
                showError('Введите описание изображения.');
                promptInput.focus();
                return;
            }

            // Собираем итоговый промпт: описание + суффикс стиля
            const fullPrompt = suffix ? `${prompt}, ${suffix}` : prompt;

            setLoading(true);
            hideError();
            showSkeleton();

            fetch(API_BASE + '/generate', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    prompt:  fullPrompt,
                    size:    size,
                    style:   style,
                }),
            })
            .then(function (response) {
                return response.json().then(function (data) {
                    return { ok: response.ok, status: response.status, data: data };
                });
            })
            .then(function (result) {
                setLoading(false);

                if (!result.ok) {
                    hideSkeleton();
                    showError(result.data.error || 'Ошибка сервера. Попробуйте снова.');
                    return;
                }

                if (!result.data.url) {
                    hideSkeleton();
                    showError('Сервер не вернул изображение. Попробуйте снова.');
                    return;
                }

                // Показываем изображение
                showImage(result.data.url, result.data.revised_prompt);
            })
            .catch(function (err) {
                setLoading(false);
                hideSkeleton();
                console.error('[AI Image Widget] Ошибка:', err);
                showError('Не удалось подключиться к серверу. Убедитесь, что backend запущен.');
            });
        }

        // ── Вспомогательные функции UI ──

        function setLoading(isLoading) {
            generateBtn.disabled = isLoading;
            generateBtn.innerHTML = isLoading
                ? '<span class="aig-loader"></span>Генерирую...'
                : 'Сгенерировать изображение';
        }

        function showError(message) {
            errorBlock.textContent = '⚠ ' + message;
            errorBlock.classList.add('visible');
        }

        function hideError() {
            errorBlock.classList.remove('visible');
            errorBlock.textContent = '';
        }

        function showSkeleton() {
            // Подбираем aspect-ratio скелетона под выбранный размер
            var size = sizeSelect.value;
            var ratio = '1 / 1';
            if (size === '1792x1024') ratio = '1792 / 1024';
            if (size === '1024x1792') ratio = '1024 / 1792';
            skeleton.style.aspectRatio = ratio;

            resultBlock.classList.add('visible');
            skeleton.style.display = 'block';
            imageWrap.style.display = 'none';
            revisedBlock.style.display = 'none';
        }

        function hideSkeleton() {
            skeleton.style.display = 'none';
        }

        function showImage(url, revised) {
            // Когда картинка загрузилась — скрываем скелетон и показываем img
            imageEl.onload = function () {
                hideSkeleton();
                imageWrap.style.display = 'block';
            };
            imageEl.onerror = function () {
                hideSkeleton();
                showError('Не удалось загрузить изображение. Попробуйте ещё раз.');
            };

            imageEl.src = url;

            // Ссылка для скачивания
            downloadBtn.href = url;
            downloadBtn.setAttribute('download', 'ai-image.png');

            // Показываем переработанный промпт если он отличается
            if (revised && revised !== promptInput.value.trim()) {
                revisedText.textContent = revised;
                revisedBlock.style.display = 'block';
            } else {
                revisedBlock.style.display = 'none';
            }
        }
    }

    // ──────────────────────────────────────────
    // Запуск
    // ──────────────────────────────────────────

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
