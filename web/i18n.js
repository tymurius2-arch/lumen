// Site languages: Українська / Русский / English. The page is written in Russian;
// texts are swapped from this dictionary. Choice is remembered on the visitor's device.
(function () {
  const D = [
    ['Возможности', 'Можливості', 'Features'], ['Поддержать', 'Підтримати', 'Support'], ['Скачать', 'Завантажити', 'Download'], ['Разделы', 'Розділи', 'Sections'],
    ['Фоторедактор · версия 1.3', 'Фоторедактор · версія 1.3', 'Photo editor · version 1.3'],
    ['Фото как с', 'Фото як з', 'Photos like on'], ['. Контроль как в Photoshop.', '. Контроль як у Photoshop.', '. Control like in Photoshop.'],
    ['Lumen — программа для компьютера и телефона. Фильтры и настройки взяты из «Фото» на iPhone, рядом инструменты Photoshop (слои, маски, кривые, восстанавливающая кисть), шрифты и шаблоны как в Canva и ИИ, который убирает фон одним кликом. Открывает RAW и HEIC, работает без интернета. Все бесплатно.',
     'Lumen — програма для комп’ютера й телефона. Фільтри та налаштування взято з «Фото» на iPhone, поруч інструменти Photoshop (шари, маски, криві, відновлювальний пензель), шрифти й шаблони як у Canva та ШІ, що прибирає фон одним кліком. Відкриває RAW і HEIC, працює без інтернету. Усе безкоштовно.',
     'Lumen is an app for your computer and phone. Filters and adjustments come from iPhone Photos, next to Photoshop tools (layers, masks, curves, healing brush), Canva-style fonts and templates, and AI that removes the background in one click. Opens RAW and HEIC, works offline. All free.'],
    ['Скачать для Windows', 'Завантажити для Windows', 'Download for Windows'], ['Скачать для macOS', 'Завантажити для macOS', 'Download for macOS'], ['Скачать для Android', 'Завантажити для Android', 'Download for Android'],
    ['Windows · macOS · Android · полностью бесплатно', 'Windows · macOS · Android · повністю безкоштовно', 'Windows · macOS · Android · completely free'],
    ['10 фильтров', '10 фільтрів', '10 filters'], ['Оригинал', 'Оригінал', 'Original'], ['Яркий теплый', 'Яскравий теплий', 'Vivid Warm'], ['Яркий холодный', 'Яскравий холодний', 'Vivid Cool'], ['Яркий', 'Яскравий', 'Vivid'],
    ['Драматичный теплый', 'Драматичний теплий', 'Dramatic Warm'], ['Драматичный холодный', 'Драматичний холодний', 'Dramatic Cool'], ['Драматичный', 'Драматичний', 'Dramatic'],
    ['Моно', 'Моно', 'Mono'], ['Серебристый', 'Сріблястий', 'Silvertone'], ['Нуар', 'Нуар', 'Noir'], ['Фильтры', 'Фільтри', 'Filters'],
    ['iPhone, Photoshop и Canva в одной программе', 'iPhone, Photoshop і Canva в одній програмі', 'iPhone, Photoshop and Canva in one app'],
    ['Шкалы, иконки и названия те же, что в «Фото», поэтому начать можно сразу. А для точной работы в меню «Изображение», «Фильтр» и «Инструменты» есть привычные функции Photoshop с теми же сочетаниями клавиш.',
     'Шкали, іконки й назви ті самі, що у «Фото», тож почати можна одразу. А для точної роботи в меню «Зображення», «Фільтр» та «Інструменти» є звичні функції Photoshop з тими самими сполученнями клавіш.',
     'The dials, icons and names are the same as in Photos, so you can start right away. For precise work, the Image, Filter and Tools menus hold familiar Photoshop features with the same shortcuts.'],
    ['как на iPhone', 'як на iPhone', 'like on iPhone'], ['как в Photoshop', 'як у Photoshop', 'like in Photoshop'], ['как в Canva', 'як у Canva', 'like in Canva'], ['для работы', 'для роботи', 'for work'],
    ['настроек и 10 фильтров', 'налаштувань і 10 фільтрів', 'adjustments and 10 filters'],
    ['Экспозиция, Блеск, Тени, Сочность, Четкость и остальные в том же порядке, что в «Фото». Фильтры Яркий, Драматичный, Нуар со шкалой силы.', 'Експозиція, Блиск, Тіні, Соковитість, Чіткість та інші в тому ж порядку, що у «Фото». Фільтри Яскравий, Драматичний, Нуар зі шкалою сили.', 'Exposure, Brilliance, Shadows, Vibrance, Definition and the rest in the same order as in Photos. Vivid, Dramatic and Noir filters with a strength dial.'],
    ['Слои', 'Шари', 'Layers'], ['Слои, режимы наложения, трансформация', 'Шари, режими накладання, трансформація', 'Layers, blend modes, transform'],
    ['Текст, фото, логотипы и фигуры отдельными слоями: непрозрачность, 16 режимов наложения, поворот, копия через Alt, умные направляющие.', 'Текст, фото, логотипи й фігури окремими шарами: непрозорість, 16 режимів накладання, поворот, копія через Alt, розумні напрямні.', 'Text, photos, logos and shapes as separate layers: opacity, 16 blend modes, rotation, Alt-drag copies, smart guides.'],
    ['ИИ', 'ШІ', 'AI'], ['Выделение объекта и удаление фона', 'Виділення об’єкта й видалення фону', 'Subject selection and background removal'],
    ['Нажмите на человека или вещь: ИИ выделит их целиком. Удалить, размыть или обесцветить фон, вырезать объект в слой. Работает на устройстве.', 'Натисніть на людину або річ: ШІ виділить їх повністю. Видалити, розмити чи знебарвити фон, вирізати об’єкт у шар. Працює на пристрої.', 'Click a person or object and AI selects all of it. Remove, blur or desaturate the background, cut the subject to a layer. Runs on your device.'],
    ['следов после ретуши', 'слідів після ретуші', 'traces after retouching'],
    ['Точечная восстанавливающая кисть переносит текстуру и подгоняет цвет по краям. Отдельно: убрать покраснения, сглаживание кожи с сохранением пор, штамп.', 'Точковий відновлювальний пензель переносить текстуру й підганяє колір по краях. Окремо: прибрати почервоніння, згладжування шкіри зі збереженням пор, штамп.', 'The Spot Healing Brush copies texture and matches color at the edges. Plus: remove redness, skin smoothing that keeps pores, clone stamp.'],
    ['вида масок', 'види масок', 'kinds of masks'],
    ['Кисть, градиент и радиальный фильтр: затемнить только небо, высветлить лицо, размыть фон. Маску можно сделать из ИИ-выделения.', 'Пензель, градієнт і радіальний фільтр: затемнити лише небо, освітлити обличчя, розмити фон. Маску можна зробити з ШІ-виділення.', 'Brush, gradient and radial filter: darken just the sky, brighten a face, blur the background. A mask can come from an AI selection.'],
    ['коррекций и 6 фильтров', 'корекцій і 6 фільтрів', 'adjustments and 6 filters'], ['Уровни', 'Рівні', 'Levels'], ['Кривые', 'Криві', 'Curves'], ['Цветовой баланс', 'Колірний баланс', 'Color Balance'],
    ['Тон/Насыщенность', 'Тон/Насиченість', 'Hue/Saturation'], ['Фотофильтр', 'Фотофільтр', 'Photo Filter'], ['Карта градиента', 'Карта градієнта', 'Gradient Map'], ['Размытие', 'Розмиття', 'Blur'], ['Шум', 'Шум', 'Noise'],
    ['Мозаика', 'Мозаїка', 'Mosaic'], ['Тиснение', 'Тиснення', 'Emboss'],
    ['шрифтов с кириллицей', 'шрифтів з кирилицею', 'fonts with Cyrillic'],
    ['Montserrat, Playfair, Lobster, Caveat, Unbounded и другие. 10 готовых стилей текста: неон, контур, плашка, ретро. Обводка, тень, интервалы.', 'Montserrat, Playfair, Lobster, Caveat, Unbounded та інші. 10 готових стилів тексту: неон, контур, плашка, ретро. Обведення, тінь, інтервали.', 'Montserrat, Playfair, Lobster, Caveat, Unbounded and more. 10 ready text styles: neon, outline, label, retro. Stroke, shadow, spacing.'],
    ['форматов и шаблоны', 'форматів і шаблони', 'sizes and templates'],
    ['Пост, сторис, обложка YouTube, карточка товара, листовка A4. Фирменный стиль: свои цвета, шрифты и логотип в один клик.', 'Пост, сторіс, обкладинка YouTube, картка товару, листівка A4. Фірмовий стиль: свої кольори, шрифти й логотип в один клік.', 'Post, story, YouTube thumbnail, product card, A4 flyer. Brand kit: your colors, fonts and logo in one click.'],
    ['RAW, HEIC и пакетная обработка', 'RAW, HEIC і пакетна обробка', 'RAW, HEIC and batch processing'],
    ['Снимки с зеркалок (CR2, CR3, NEF, ARW, DNG и др.) и фото с iPhone. Одни и те же правки сразу к сотням фото, свои стили.', 'Знімки з дзеркалок (CR2, CR3, NEF, ARW, DNG тощо) і фото з iPhone. Ті самі правки одразу до сотень фото, власні стилі.', 'Shots from DSLRs (CR2, CR3, NEF, ARW, DNG and more) and iPhone photos. The same edits on hundreds of photos at once, your own looks.'],
    ['Бесплатно. Все функции.', 'Безкоштовно. Усі функції.', 'Free. Every feature.'],
    ['В Lumen нет подписок, платных функций и рекламы. Все, что есть в программе, доступно каждому. Если Lumen вам помог, можно поддержать автора любой суммой.', 'У Lumen немає підписок, платних функцій і реклами. Усе, що є в програмі, доступне кожному. Якщо Lumen вам допоміг, можна підтримати автора будь-якою сумою.', 'Lumen has no subscriptions, paid features or ads. Everything in the app is open to everyone. If Lumen helped you, you can support the author with any amount.'],
    ['навсегда', 'назавжди', 'forever'], ['Настройки и фильтры как на iPhone', 'Налаштування та фільтри як на iPhone', 'Adjustments and filters like on iPhone'],
    ['Слои, маски, кривые, ретушь кожи, штамп', 'Шари, маски, криві, ретуш шкіри, штамп', 'Layers, masks, curves, skin retouching, clone stamp'],
    ['ИИ: удаление фона и вырезание объектов', 'ШІ: видалення фону й вирізання об’єктів', 'AI: background removal and subject cut-out'],
    ['36 шрифтов, шаблоны, фирменный стиль', '36 шрифтів, шаблони, фірмовий стиль', '36 fonts, templates, brand kit'], ['Поддержать автора', 'Підтримати автора', 'Support the author'],
    ['Добровольный донат на банку monobank помогает выпускать новые версии. Оплатить можно картой любого банка, Apple Pay или Google Pay.', 'Добровільний донат на банку monobank допомагає випускати нові версії. Оплатити можна карткою будь-якого банку, Apple Pay або Google Pay.', 'A voluntary donation to the monobank jar helps release new versions. Pay with any bank card, Apple Pay or Google Pay.'],
    ['Открыть банку monobank', 'Відкрити банку monobank', 'Open the monobank jar'], ['Ссылка на банку скоро появится.', 'Посилання на банку скоро з’явиться.', 'The jar link is coming soon.'],
    ['Скачать Lumen', 'Завантажити Lumen', 'Download Lumen'],
    ['Обычная программа: установщик, иконка на рабочем столе, меню как в Photoshop, открытие фото двойным щелчком. На Android — приложение. Версия для iPhone и iPad готовится к App Store.', 'Звичайна програма: інсталятор, іконка на робочому столі, меню як у Photoshop, відкриття фото подвійним клацанням. На Android — застосунок. Версія для iPhone та iPad готується до App Store.', 'A regular app: installer, desktop icon, Photoshop-style menus, open photos with a double-click. An app on Android. The iPhone and iPad version is being prepared for the App Store.'],
    ['для вашего компьютера', 'для вашого комп’ютера', 'for your computer'], ['для вашего телефона', 'для вашого телефона', 'for your phone'],
    ['Система', 'Система', 'System'], ['Windows 10 и 11, 64-бит', 'Windows 10 і 11, 64-біт', 'Windows 10 and 11, 64-bit'], ['Файл', 'Файл', 'File'], ['≈ 124 МБ', '≈ 124 МБ', '≈ 124 MB'], ['Версия', 'Версія', 'Version'],
    ['Если Windows покажет «Система Windows защитила ваш компьютер», нажмите «Подробнее», затем «Выполнить в любом случае». Так бывает с новыми программами без платной цифровой подписи.', 'Якщо Windows покаже «Систему Windows захищено», натисніть «Докладніше», потім «Усе одно запустити». Так буває з новими програмами без платного цифрового підпису.', 'If Windows shows “Windows protected your PC”, click “More info”, then “Run anyway”. This happens with new apps that lack a paid digital signature.'],
    ['macOS 11 Big Sur и новее', 'macOS 11 Big Sur і новіші', 'macOS 11 Big Sur or later'], ['Процессор', 'Процесор', 'Processor'], ['Apple M1–M4 и Intel', 'Apple M1–M4 та Intel', 'Apple M1–M4 and Intel'],
    ['Перетащите Lumen в «Программы». При первом запуске нажмите на иконку правой кнопкой и выберите «Открыть». Если macOS пишет, что программа повреждена, выполните в Терминале', 'Перетягніть Lumen у «Програми». Під час першого запуску натисніть на іконку правою кнопкою й виберіть «Відкрити». Якщо macOS пише, що програму пошкоджено, виконайте в Терміналі', 'Drag Lumen to Applications. On first launch, right-click the icon and choose Open. If macOS says the app is damaged, run this in Terminal:'],
    ['Android 7 и новее', 'Android 7 і новіші', 'Android 7 or later'],
    ['Откройте скачанный файл и разрешите установку из этого источника. В Google Play Lumen появится позже.', 'Відкрийте завантажений файл і дозвольте встановлення з цього джерела. У Google Play Lumen з’явиться пізніше.', 'Open the downloaded file and allow installs from this source. Lumen will come to Google Play later.'],
    ['Lumen 1.3 · бесплатный фоторедактор для Windows, macOS и Android', 'Lumen 1.3 · безкоштовний фоторедактор для Windows, macOS і Android', 'Lumen 1.3 · free photo editor for Windows, macOS and Android'],
    ['Фото обрабатываются только на вашем устройстве', 'Фото обробляються лише на вашому пристрої', 'Photos are processed only on your device'],
    ['Окно Lumen: дизайн по шаблону со шрифтом Lobster, справа панель слоев со стилями текста и шрифтами', 'Вікно Lumen: дизайн за шаблоном зі шрифтом Lobster, праворуч панель шарів зі стилями тексту й шрифтами', 'Lumen window: a template design in the Lobster font, with the layers panel of text styles and fonts on the right'],
    ['Lumen — программа-фоторедактор для Windows и macOS: фильтры и настройки как на iPhone, уровни, кривые, штамп и восстанавливающая кисть как в Photoshop.', 'Lumen — програма-фоторедактор для Windows і macOS: фільтри та налаштування як на iPhone, рівні, криві, штамп і відновлювальний пензель як у Photoshop.', 'Lumen is a photo editor for Windows and macOS: filters and adjustments like on iPhone, levels, curves, clone stamp and healing brush like in Photoshop.'],
  ];
  const DICT = {}; D.forEach(([ru, uk, en]) => { DICT[ru] = {uk, en}; });
  const LANGS = [['uk', 'УКР', 'Українська'], ['ru', 'РУС', 'Русский'], ['en', 'ENG', 'English']];
  const IMG = {ru: 'img/app-design.jpg', uk: 'img/app-design-uk.jpg', en: 'img/app-design-en.jpg'};
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const detect = () => { const n = (navigator.language || '').toLowerCase(); return n.startsWith('uk') ? 'uk' : n.startsWith('ru') || n.startsWith('be') ? 'ru' : 'en'; };
  let lang; try { lang = localStorage.getItem('lumen.site.lang'); } catch (e) {}
  if (!LANGS.some(l => l[0] === lang)) lang = detect();

  const texts = [], attrs = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const p = n.parentNode.tagName; if (p === 'SCRIPT' || p === 'STYLE') continue;
    const k = norm(n.nodeValue); if (DICT[k]) texts.push({n, ru: n.nodeValue, k});
  }
  document.querySelectorAll('[title],[aria-label],[alt]').forEach(el => ['title', 'aria-label', 'alt'].forEach(a => { const v = el.getAttribute(a); if (v && DICT[norm(v)]) attrs.push({el, a, ru: v}); }));
  const meta = document.querySelector('meta[name="description"]'), metaRu = meta ? meta.content : '';
  const hero = document.querySelector('.desk img');

  function apply(l) {
    lang = l; try { localStorage.setItem('lumen.site.lang', l); } catch (e) {}
    const tr = ru => l === 'ru' ? ru : (DICT[norm(ru)] ? DICT[norm(ru)][l] : ru);
    texts.forEach(t => { const lead = t.ru.match(/^\s*/)[0], trail = t.ru.match(/\s*$/)[0]; t.n.nodeValue = l === 'ru' ? t.ru : lead + DICT[t.k][l] + trail; });
    attrs.forEach(t => t.el.setAttribute(t.a, tr(t.ru)));
    if (meta) meta.content = tr(metaRu);
    if (hero) hero.src = IMG[l];
    document.documentElement.lang = l;
    document.querySelectorAll('.langs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.l === l));
  }

  // switcher in the header
  const box = document.createElement('div');
  box.className = 'langs'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Language');
  box.innerHTML = LANGS.map(([id, short, full]) => `<button type="button" data-l="${id}" lang="${id}" title="${full}">${short}</button>`).join('');
  box.addEventListener('click', e => { const b = e.target.closest('button'); if (b) apply(b.dataset.l); });
  const nav = document.querySelector('.nav .wrap'); if (nav) nav.appendChild(box);
  apply(lang);
})();
