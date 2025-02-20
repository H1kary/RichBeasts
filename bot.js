require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { Sequelize, DataTypes } = require('sequelize');

// Настройка Sequelize для отключения логов SQL
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false // Отключаем логирование SQL
});

// Модель пользователя
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  username: { type: DataTypes.STRING },
  firstName: { type: DataTypes.STRING },
  lastName: { type: DataTypes.STRING },
  eggs: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
  money: { type: DataTypes.DECIMAL(10, 2), defaultValue: 100.0 },
  lastCollection: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  chicken_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  incubator_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  duck_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  aviary_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  goose_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  cow_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  pig_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  sheep_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  milk: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },       // Молоко от коров
  meat: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },       // Мясо от свиней
  wool: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },       // Шерсть от овец
  feathers: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },    // Перья от уток
  down: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },      // Пух от гусей
  lastDailyBonus: { type: DataTypes.DATE, defaultValue: null },
  egg_robot_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  egg_factory_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  egg_3d_printer_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  feather_drone_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  feather_nano_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  feather_matrix_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  down_cloud_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  down_quantum_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  down_blackhole_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  wool_ai_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  wool_reactor_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  wool_galaxy_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  milk_asteroid_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  milk_quantum_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  milk_singularity_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  meat_hologram_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  meat_portal_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  meat_bigbang_count: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'Users',
  timestamps: true,
  createdAt: true,
  updatedAt: false  // ← Отключаем только updatedAt
});

// Обновляем структуру ANIMAL_CATEGORIES
const ANIMAL_CATEGORIES = {
  eggs: {
    name: '🥚 Яйца',
    producers: [
      {
        id: 'chicken',
        name: '🐔 Курица',
        basePrice: 50,
        production: 1,
        description: '1 🥚/мин'
      },
      {
        id: 'incubator',
        name: '🏭 Инкубатор',
        basePrice: 500,
        production: 15,
        description: '15 🥚/мин'
      },
      {
        id: 'egg_robot',
        name: '🤖 Яйцеробот',
        basePrice: 2500,
        production: 50,
        description: '50 🥚/мин'
      },
      {
        id: 'egg_factory',
        name: '🏭 Яичный комбинат',
        basePrice: 10000,
        production: 200,
        description: '200 🥚/мин'
      },
      {
        id: 'egg_3d_printer',
        name: '🖨 3D Принтер яиц',
        basePrice: 50000,
        production: 1000,
        description: '1000 🥚/мин'
      }
    ]
  },
  feathers: {
    name: '🪶 Перья',
    producers: [
      {
        id: 'duck',
        name: '🦆 Утка',
        basePrice: 100,
        production: 1,
        description: '1 🪶/мин'
      },
      {
        id: 'aviary',
        name: '🏭 Птичник',
        basePrice: 1200,
        production: 20,
        description: '20 🪶/мин'
      },
      {
        id: 'feather_drone',
        name: '🚁 Перьедыр',
        basePrice: 6000,
        production: 100,
        description: '100 🪶/мин'
      },
      {
        id: 'feather_nano',
        name: '⚛ Нано-перья',
        basePrice: 30000,
        production: 500,
        description: '500 🪶/мин'
      },
      {
        id: 'feather_matrix',
        name: '🧿 Матрица перьев',
        basePrice: 150000,
        production: 2500,
        description: '2500 🪶/мин'
      }
    ]
  },
  down: {
    name: '🛌 Пух',
    producers: [
      {
        id: 'goose',
        name: '🦢 Гусь',
        basePrice: 200,
        production: 1,
        description: '1 🛌/мин'
      },
      {
        id: 'down_farm',
        name: '🏭 Пуховая ферма',
        basePrice: 2500,
        production: 25,
        description: '25 🛌/мин'
      },
      {
        id: 'down_cloud',
        name: '☁ Пуховое облако',
        basePrice: 15000,
        production: 150,
        description: '150 🛌/мин'
      },
      {
        id: 'down_quantum',
        name: '⚛ Квантовый пух',
        basePrice: 75000,
        production: 800,
        description: '800 🛌/мин'
      },
      {
        id: 'down_blackhole',
        name: '🕳 Пуховая черная дыра',
        basePrice: 300000,
        production: 4000,
        description: '4000 🛌/мин'
      }
    ]
  },
  wool: {
    name: '🧶 Шерсть',
    producers: [
      {
        id: 'sheep',
        name: '🐑 Овца',
        basePrice: 300,
        production: 1,
        description: '1 🧶/мин'
      },
      {
        id: 'wool_factory',
        name: '🏭 Шерстяная фабрика',
        basePrice: 3500,
        production: 30,
        description: '30 🧶/мин'
      },
      {
        id: 'wool_ai',
        name: '🧠 ИИ-Прядильщик',
        basePrice: 20000,
        production: 200,
        description: '200 🧶/мин'
      },
      {
        id: 'wool_reactor',
        name: '☢ Шерстяной реактор',
        basePrice: 100000,
        production: 1200,
        description: '1200 🧶/мин'
      },
      {
        id: 'wool_galaxy',
        name: '🌌 Галактика шерсти',
        basePrice: 500000,
        production: 10000,
        description: '10000 🧶/мин'
      }
    ]
  },
  milk: {
    name: '🥛 Молоко',
    producers: [
      {
        id: 'cow',
        name: '🐄 Корова',
        basePrice: 400,
        production: 1,
        description: '1 🥛/мин'
      },
      {
        id: 'dairy_plant',
        name: '🏭 Молочный завод',
        basePrice: 5000,
        production: 40,
        description: '40 🥛/мин'
      },
      {
        id: 'milk_asteroid',
        name: '☄ Молочный астероид',
        basePrice: 30000,
        production: 300,
        description: '300 🥛/мин'
      },
      {
        id: 'milk_quantum',
        name: '⚛ Квантовая дойка',
        basePrice: 150000,
        production: 2000,
        description: '2000 🥛/мин'
      },
      {
        id: 'milk_singularity',
        name: '🌀 Молочная сингулярность',
        basePrice: 750000,
        production: 15000,
        description: '15000 🥛/мин'
      }
    ]
  },
  meat: {
    name: '🥩 Мясо',
    producers: [
      {
        id: 'pig',
        name: '🐖 Свинья',
        basePrice: 600,
        production: 1,
        description: '1 🥩/мин'
      },
      {
        id: 'meat_combine',
        name: '🏭 Мясной комбинат',
        basePrice: 7500,
        production: 50,
        description: '50 🥩/мин'
      },
      {
        id: 'meat_hologram',
        name: '👽 Голограммятина',
        basePrice: 50000,
        production: 400,
        description: '400 🥩/мин'
      },
      {
        id: 'meat_portal',
        name: '🌀 Мясной портал',
        basePrice: 250000,
        production: 3000,
        description: '3000 🥩/мин'
      },
      {
        id: 'meat_bigbang',
        name: '💥 Мясной Большой Взрыв',
        basePrice: 1000000,
        production: 25000,
        description: '25000 🥩/мин'
      }
    ]
  }
};

// Добавляем цены на ресурсы
const RESOURCE_PRICES = {
  eggs: 0.1,     // Базовый ресурс
  feathers: 0.5, // Редкие перья
  down: 1.2,     // Ценный пух
  wool: 2.0,     // Качественная шерсть
  milk: 3.5,     // Премиальное молоко
  meat: 5.0      // Элитное мясо
};

// Добавим список всех ресурсов и категорий для справки
const RESOURCE_TYPES = Object.keys(RESOURCE_PRICES);
const PRODUCER_TYPES = Object.values(ANIMAL_CATEGORIES)
  .flatMap(cat => cat.producers.map(p => p.id));

// Добавляем синхронизацию перед использованием бота
(async () => {
  await sequelize.sync({ force: false });
  console.log('База данных синхронизирована');
})();

const bot = new Telegraf(process.env.TEST_BOT_TOKEN);

// Создаем клавиатуру
const getMainKeyboard = (user) => {
  const bonusAvailable = checkBonusAvailability(user);
  
  return Markup.keyboard([
    ['👤 Профиль', '🛒 Купить животное'],
    ['📦 Собрать ресурсы', '💰 Продать ресурсы'],
    bonusAvailable 
      ? ['🎁 Ежедневный бонус', '🔍 Дополнительно']
      : ['🔍 Дополнительно']
  ]).resize();
};

// Добавляем функцию проверки доступности бонуса
const checkBonusAvailability = (user) => {
  if (!user.lastDailyBonus) return true;
  const now = new Date();
  const lastBonus = new Date(user.lastDailyBonus);
  const hoursDiff = Math.floor((now - lastBonus) / (1000 * 60 * 60));
  return hoursDiff >= 24;
};

// Инициализация сессии должна быть первой
bot.use(async (ctx, next) => {
  ctx.session ??= { tradeData: {} };
  return next();
});

// Добавляем проверку прав администратора
const ADMIN_ID = 1126975443;
const isAdmin = (ctx) => ctx.from.id === ADMIN_ID;

// Регистрация пользователя при первом использовании
bot.use(async (ctx, next) => {
  const user = await User.findOrCreate({
    where: { id: ctx.from.id },
    defaults: { 
      id: ctx.from.id,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
      lastDailyBonus: null
    }
  });
  
  // Логирование только при создании нового пользователя
  if (user[1]) {
    console.log(`[NEW USER] ID: ${ctx.from.id} (@${ctx.from.username || 'no_username'})`);
  }
  
  await User.update({
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name
  }, { where: { id: ctx.from.id } });
  
  ctx.user = user[0];
  return next();
});

// Команды бота
bot.start((ctx) => {
  console.log(`[START] User ${ctx.from.id} (@${ctx.from.username || 'no_username'})`);
  ctx.replyWithMarkdown(
    '🎮 *Добро пожаловать на ферму!*\nНачальный капитал: ${ctx.user.money.toFixed(2)}💰', 
    getMainKeyboard(ctx.user)
  )
});

bot.hears('👤 Профиль', async (ctx) => {
  const user = ctx.user;
  let totalPerMinute = 0;
  
  // Собираем всех производителей
  const allProducers = Object.values(ANIMAL_CATEGORIES)
    .flatMap(cat => cat.producers.map(p => ({ ...p, category: cat.name })));
  
  const animalsList = allProducers
    .map(producer => {
      const count = user[`${producer.id}_count`];
      const production = getAnimalProduction(user, producer.id) * count;
      totalPerMinute += production;
      const categoryMap = {
        '🥚 Яйца': 'eggs',
        '🪶 Перья': 'feathers',
        '🛌 Пух': 'down',
        '🧶 Шерсть': 'wool',
        '🥛 Молоко': 'milk',
        '🥩 Мясо': 'meat'
      };
      const emoji = {
        eggs: '🥚', feathers: '🪶', down: '🛌',
        wool: '🧶', milk: '🥛', meat: '🥩'
      }[categoryMap[producer.category]];
      
      return count > 0 
        ? `${producer.name} ${count}шт. (${Math.round(production)}${emoji}/мин)`
        : '';
    })
    .filter(Boolean)
    .join('\n') || 'У вас пока нет животных';

  // Сортируем ресурсы по цене
  const sortedResources = Object.entries(RESOURCE_PRICES)
    .sort((a, b) => Object.keys(RESOURCE_PRICES).indexOf(a[0]) - Object.keys(RESOURCE_PRICES).indexOf(b[0]))
    .map(([res]) => res);

  ctx.replyWithMarkdown(
    `*👤 Ваш профиль*\n\n` +
    `${sortedResources.map(res => {
      const emoji = {
        eggs: '🥚', feathers: '🪶', down: '🛌',
        wool: '🧶', milk: '🥛', meat: '🥩'
      }[res];
      return `${emoji} ${getResourceName(res)}: ${user[res].toFixed(2)}`;
    }).join('\n')}\n\n` +
    `💰 Деньги: ${user.money.toFixed(2)}\n` +
    `*Производства:*\n${animalsList}`,
    getMainKeyboard(user)
  );
});

bot.hears('🛒 Купить животное', async (ctx) => {
  const buttons = Object.entries(ANIMAL_CATEGORIES).map(([id, category]) => 
    Markup.button.callback(category.name, `buy_category_${id}`)
  );
  
  ctx.replyWithMarkdown(
    '🏭 *Выберите тип производства:*',
    Markup.inlineKeyboard(buttons, { columns: 2 })
  );
});

bot.hears('📦 Собрать ресурсы', async (ctx) => {
  const now = new Date();
  const last = new Date(ctx.user.lastCollection);
  const seconds = Math.max(0, Math.floor((now - last) / 1000));
  
  const resources = {
    eggs: 0,
    milk: 0,
    meat: 0,
    wool: 0,
    feathers: 0,
    down: 0
  };

  Object.entries(ANIMAL_CATEGORIES).forEach(([resource, category]) => {
    category.producers.forEach(animal => {
      const count = ctx.user[`${animal.id}_count`];
      let production = 0;
      
      for(let i = 0; i < count; i++) {
        production += animal.production;
      }
      
      const amount = production * (seconds / 60); // Считаем в минутах с дробями
      resources[resource] += amount;
    });
  });

  // Обновляем ресурсы
  ctx.user.eggs = parseFloat((ctx.user.eggs + resources.eggs).toFixed(2));
  ctx.user.milk = parseFloat((ctx.user.milk + resources.milk).toFixed(2));
  ctx.user.meat = parseFloat((ctx.user.meat + resources.meat).toFixed(2));
  ctx.user.wool = parseFloat((ctx.user.wool + resources.wool).toFixed(2));
  ctx.user.feathers = parseFloat((ctx.user.feathers + resources.feathers).toFixed(2));
  ctx.user.down = parseFloat((ctx.user.down + resources.down).toFixed(2));
  
  ctx.user.lastCollection = now;
  await ctx.user.save();

  // Фильтруем и сортируем ресурсы
  const orderedResources = Object.entries(resources)
    .filter(([_, value]) => value > 0)
    .sort((a, b) => Object.keys(RESOURCE_PRICES).indexOf(a[0]) - Object.keys(RESOURCE_PRICES).indexOf(b[0]));
  
  const resourcesList = orderedResources
    .map(([res, value]) => {
      const emoji = {
        eggs: '🥚', feathers: '🪶', down: '🛌',
        wool: '🧶', milk: '🥛', meat: '🥩'
      }[res];
      return `${emoji} ${getResourceName(res)}: ${value.toFixed(2)}`;
    })
    .join('\n');

  ctx.replyWithMarkdown(
    `📦 *Собрано ресурсов за ${(seconds/60).toFixed(1)} минут:*\n` +
    (resourcesList || '⚠️ Нет новых ресурсов'),
    Markup.inlineKeyboard([
      Markup.button.callback('💰 Продать ресурсы', 'open_sell_menu')
    ])
  );
});

bot.hears('💰 Продать ресурсы', async (ctx) => {
  ctx.replyWithMarkdown(
    `💰 *Выберите ресурс для продажи:*\n` +
    `Цены за 1 ед.:\n` +
    `🥚 Яйца: ${RESOURCE_PRICES.eggs}💰\n` +
    `🪶 Перья: ${RESOURCE_PRICES.feathers}💰\n` +
    `🛌 Пух: ${RESOURCE_PRICES.down}💰\n` +
    `🧶 Шерсть: ${RESOURCE_PRICES.wool}💰\n` +
    `🥛 Молоко: ${RESOURCE_PRICES.milk}💰\n` +
    `🥩 Мясо: ${RESOURCE_PRICES.meat}💰`,
    Markup.inlineKeyboard([
      Markup.button.callback('🥚 Яйца', 'sell_eggs'),
      Markup.button.callback('🪶 Перья', 'sell_feathers'),
      Markup.button.callback('🛌 Пух', 'sell_down'),
      Markup.button.callback('🧶 Шерсть', 'sell_wool'),
      Markup.button.callback('🥛 Молоко', 'sell_milk'),
      Markup.button.callback('🥩 Мясо', 'sell_meat'),
      Markup.button.callback('💥 Продать ВСЁ', 'sell_all')
    ], { columns: 3 })
  );
});

// Выносим логику лидеров в отдельную функцию
const handleLeaders = async (ctx) => {
  try {
    const allUsers = await User.findAll({
      order: [['money', 'DESC']],
      attributes: ['id', 'money', 'username', 'firstName', 'lastName']
    });

    const userId = ctx.from.id;
    const userIndex = allUsers.findIndex(u => u.id === userId);
    const userPosition = userIndex >= 0 ? userIndex + 1 : 'Не в топе';

    const top10 = allUsers.slice(0, 10).map((u, index) => {
      let name = u.username 
        ? `@${u.username}` 
        : [u.firstName, u.lastName].filter(Boolean).join(' ') 
          || `ID: ${u.id}`;
      
      name = name.replace(/([_*[\]()~`>#+=\-|{}.!])/g, '\\$1');
      
      return `${index + 1}. ${u.id === userId ? '👉 ' : ''}${name} - ${u.money.toFixed(2)}💰`;
    }).join('\n');

    await ctx.replyWithMarkdown(
      `*🏆 Топ-10 фермеров:*\n\n${top10}\n\n` +
      `*Ваша позиция:* ${userPosition}\n` +
      `*Ваш баланс:* ${ctx.user.money.toFixed(2)}💰`,
      { disable_web_page_preview: true }
    );
  } catch (error) {
    console.error(`[LEADERS_ERROR] User ${ctx.from.id} (@${ctx.from.username || 'no_username'}):`, error);
    ctx.reply('⚠️ Не удалось загрузить таблицу лидеров');
  }
};

// Обновляем обработчики
bot.hears('🏆 Лидеры', handleLeaders);
bot.action('show_leaders', async (ctx) => {
  console.log(`[LEADERS] User ${ctx.from.id} запросил таблицу лидеров`);
  await ctx.deleteMessage();
  await handleLeaders(ctx);
});

// Обновляем обработчик помощи для отображения только производств
bot.action('show_help', async (ctx) => {
  await ctx.deleteMessage();
  
  // Формируем список всех производств
  const productionList = Object.values(ANIMAL_CATEGORIES)
    .map(category => {
      const producersList = category.producers
        .map(producer => 
          `▫️ ${producer.name} - ${producer.description} (начальная цена: ${producer.basePrice}💰)`
        )
        .join('\n');
      return `*${category.name}*\n${producersList}`;
    })
    .join('\n\n');

  ctx.replyWithMarkdown(
    `*🏭 Список всех производств*\n\n${productionList}\n\n` +
    `- Цена растет на 10% за каждую покупку\n\n` +
    `*Система обмена*\n` +
    `Для передачи денег другому игроку:\n` +
    `Используйте команду */trade @имя_игрока сумма*\n` +
    `Пример: */trade @username 500*\n` +
    `Минимальная сумма: 1💰, максимальная: 1,000,000💰`
  );
});

bot.command('trade', async (ctx) => {
  console.log(`[TRADE_ATTEMPT] User ${ctx.from.id} (@${ctx.from.username || 'no_username'}) пытается передать деньги`);
  
  // Проверка формата команды
  if (ctx.message.text.split(' ').length < 3) {
    return ctx.replyWithMarkdown(
      '❌ *Неверный формат!*\n' +
      'Используйте: `/trade @username сумма`\n' +
      'Пример: `/trade @user123 500`'
    );
  }

  const [targetUsername, amountStr] = ctx.message.text.split(' ').slice(1);
  
  // Парсим сумму
  const amount = parseFloat(amountStr.replace(',', '.'));
  if (isNaN(amount) || amount < 1) {
    return ctx.replyWithMarkdown(
      '❌ *Некорректная сумма!*\n' +
      'Минимальная сумма для перевода: `1💰`\n' +
      'Пример: `/trade @user123 100`'
    );
  }

  // Проверяем получателя
  const cleanUsername = targetUsername.replace('@', '');
  if (!cleanUsername.match(/^[a-zA-Z0-9_]{5,32}$/)) {
    return ctx.reply('❌ Некорректное имя пользователя');
  }

  const receiver = await User.findOne({ 
    where: { username: cleanUsername } 
  });

  if (!receiver) {
    return ctx.reply('❌ Пользователь не найден');
  }

  if (receiver.id === ctx.user.id) {
    return ctx.reply('❌ Нельзя передавать деньги самому себе');
  }

  // Проверяем баланс отправителя
  if (ctx.user.money < amount) {
    return ctx.reply(
      `❌ Недостаточно средств. Ваш баланс: ${ctx.user.money.toFixed(2)}💰`
    );
  }

  // Проверка на максимальную сумму
  if (amount > 1_000_000) {
    return ctx.reply('❌ Максимальная сумма перевода: 1,000,000💰');
  }

  try {
    // Совершаем перевод
    ctx.user.money -= amount;
    receiver.money += amount;

    await Promise.all([ctx.user.save(), receiver.save()]);

    // Уведомления
    ctx.replyWithMarkdown(
      `✅ Вы успешно передали *${amount.toFixed(2)}💰* ` +
      `пользователю @${receiver.username}`
    );

    ctx.telegram.sendMessage(
      receiver.id,
      `🎁 Вы получили *${amount.toFixed(2)}💰* ` +
      `от @${ctx.user.username || ctx.user.first_name}`,
      { parse_mode: 'Markdown' }
    );

    console.log(`[TRADE_SUCCESS] User ${ctx.from.id} (@${ctx.from.username || 'no_username'}) передал ${amount}💰 пользователю ${receiver.id}`);

  } catch (error) {
    console.error(`[TRADE_ERROR] User ${ctx.from.id} (@${ctx.from.username || 'no_username'}):`, error);
    ctx.replyWithMarkdown(
      '❌ *Ошибка перевода!*\n' +
      'Попробуйте позже или обратитесь в поддержку'
    );
  }
});

// Обновляем модель пользователя (добавляем хук для инициализации animals)
User.afterFind(user => {
  if (user && !user[`chicken_count`]) {
    user[`chicken_count`] = 0;
  }
  if (user && !user[`duck_count`]) {
    user[`duck_count`] = 0;
  }
  if (user && !user[`goose_count`]) {
    user[`goose_count`] = 0;
  }
  if (user && !user[`cow_count`]) {
    user[`cow_count`] = 0;
  }
  if (user && !user[`pig_count`]) {
    user[`pig_count`] = 0;
  }
  if (user && !user[`sheep_count`]) {
    user[`sheep_count`] = 0;
  }
  if (user && user.lastDailyBonus === null) {
    const fakeOldDate = new Date(new Date() - 25 * 60 * 60 * 1000);
    user.lastDailyBonus = fakeOldDate;
    user.chicken_count ||= 0;
  }
});

// Команда добавления денег
bot.command('add_money', async (ctx) => {
  console.log(`[ADMIN] add_money by ${ctx.from.id} (@${ctx.from.username || 'no_username'})`);
  if (!isAdmin(ctx)) return;
  
  const [userId, amount] = ctx.message.text.split(' ').slice(1);
  const user = await User.findByPk(userId);
  
  if (!user) return ctx.reply('Пользователь не найден');
  
  user.money += parseFloat(amount);
  await user.save();
  ctx.reply(`✅ ${user.id} получено ${amount}💰`);
  ctx.telegram.sendMessage(userId, `Получено ${amount}💰 от Администратора\nНовый баланс: ${user.money.toFixed(2)}💰`);
});

// Команда добавления яиц
bot.command('add_eggs', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const [userId, amount] = ctx.message.text.split(' ').slice(1);
  const user = await User.findByPk(userId);
  
  if (!user) return ctx.reply('Пользователь не найден');
  
  user.eggs += parseFloat(amount);
  await user.save();
  ctx.reply(`✅ ${user.id} получено ${amount}🥚`);
  ctx.telegram.sendMessage(userId, `Получено ${amount}🥚 от Администратора\nНовый баланс: ${user.eggs.toFixed(2)}🥚`);
});

// Команда установки денег
bot.command('set_money', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const [userId, amount] = ctx.message.text.split(' ').slice(1);
  const user = await User.findByPk(userId);
  
  if (!user) return ctx.reply('Пользователь не найден');
  
  user.money = parseFloat(amount);
  await user.save();
  ctx.reply(`✅ Для ${user.id} установлено ${amount}💰`);
  ctx.telegram.sendMessage(userId, `Администратор установил ваш баланс: ${amount}💰`);
});

// Команда установки яиц
bot.command('set_eggs', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const [userId, amount] = ctx.message.text.split(' ').slice(1);
  const user = await User.findByPk(userId);
  
  if (!user) return ctx.reply('Пользователь не найден');
  
  user.eggs = parseFloat(amount);
  await user.save();
  ctx.reply(`✅ Для ${user.id} установлено ${amount}🥚`);
  ctx.telegram.sendMessage(userId, `Администратор установил яйца: ${amount}🥚`);
});

// Команда удаления денег
bot.command('delete_money', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const [userId, amount] = ctx.message.text.split(' ').slice(1);
  const user = await User.findByPk(userId);
  
  if (!user) return ctx.reply('Пользователь не найден');
  
  user.money = Math.max(0, user.money - parseFloat(amount));
  await user.save();
  ctx.reply(`✅ У ${user.id} списано ${amount}💰`);
  ctx.telegram.sendMessage(userId, `Администратор списал: ${amount}💰\nНовый баланс: ${user.money.toFixed(2)}💰`);
});

// Команда удаления яиц
bot.command('delete_eggs', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const [userId, amount] = ctx.message.text.split(' ').slice(1);
  const user = await User.findByPk(userId);
  
  if (!user) return ctx.reply('Пользователь не найден');
  
  user.eggs = Math.max(0, user.eggs - parseFloat(amount));
  await user.save();
  ctx.reply(`✅ У ${user.id} списано ${amount}🥚`);
  ctx.telegram.sendMessage(userId, `Администратор списал: ${amount}🥚\nНовый баланс: ${user.eggs.toFixed(2)}🥚`);
});

// Команда установки животных
bot.command('set_animal', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const [userId, animalId, count] = ctx.message.text.split(' ').slice(1);
  const user = await User.findByPk(userId);
  
  if (!user) return ctx.reply('Пользователь не найден');
  if (!ANIMAL_CATEGORIES[animalId]) return ctx.reply('Неверный тип животного');
  
  const field = `${animalId}_count`;
  user[field] = Math.max(0, parseInt(count));
  await user.save();
  ctx.reply(`✅ Для ${user.id} установлено ${count} ${ANIMAL_CATEGORIES[animalId].producers.find(a => a.id === animalId)?.name}`);
  ctx.telegram.sendMessage(userId, `Администратор установил: ${count} ${ANIMAL_CATEGORIES[animalId].producers.find(a => a.id === animalId)?.name}`);
});

// Команда удаления животных
bot.command('delete_animal', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const [userId, animalId, count] = ctx.message.text.split(' ').slice(1);
  const user = await User.findByPk(userId);
  
  if (!user) return ctx.reply('Пользователь не найден');
  if (!ANIMAL_CATEGORIES[animalId]) return ctx.reply('Неверный тип животного');
  
  const field = `${animalId}_count`;
  user[field] = Math.max(0, user[field] - parseInt(count));
  await user.save();
  ctx.reply(`✅ У ${user.id} списано ${count} ${ANIMAL_CATEGORIES[animalId].producers.find(a => a.id === animalId)?.name}`);
  ctx.telegram.sendMessage(userId, `Администратор списал: ${count} ${ANIMAL_CATEGORIES[animalId].producers.find(a => a.id === animalId)?.name}\nОсталось: ${user[field]}`);
});

// Исправляем функции расчета цены и продуктивности
const getAnimalPrice = (user, animalId) => {
  const animal = Object.values(ANIMAL_CATEGORIES)
    .flatMap(cat => cat.producers)
    .find(a => a.id === animalId);
  
  if (!animal) return Infinity;
  
  const count = user[`${animalId}_count`] || 0;
  return Math.round(animal.basePrice * Math.pow(1.10, count) * 100) / 100;
};

const getAnimalProduction = (user, producerId) => {
  const category = Object.values(ANIMAL_CATEGORIES).find(cat => 
    cat.producers.some(p => p.id === producerId)
  );
  const producer = category?.producers.find(p => p.id === producerId);
  return producer?.production || 0;
};

// Исправляем обработчик выбора категории
bot.action(/^buy_category_(\w+)$/, async (ctx) => {
  const categoryId = ctx.match[1];
  const category = ANIMAL_CATEGORIES[categoryId];
  
  const buttons = category.producers.map(animal => {
    const currentPrice = getAnimalPrice(ctx.user, animal.id);
    return Markup.button.callback(
      `${animal.name.replace('🏭 ', '')} ~${currentPrice}💰\n${animal.description}`,
      `buy_${animal.id}`
    );
  });
  
  ctx.editMessageText(
    `<b>${category.name.replace('🏭 ', '')} - доступные производства:</b>\n` +
    `Ваш баланс: ${ctx.user.money.toFixed(2)}💰`,
    {
      ...Markup.inlineKeyboard(buttons, { columns: 1 }),
      parse_mode: 'HTML'
    }
  );
});

// Исправляем обработчик выбора количества для покупки
bot.action(/^buy_(\w+)$/, async (ctx) => {
  const producerId = ctx.match[1];
  
  // Ищем производителя во всех категориях
  let producer;
  for (const cat of Object.values(ANIMAL_CATEGORIES)) {
    producer = cat.producers.find(p => p.id === producerId);
    if (producer) break;
  }
  
  if (!producer) {
    return ctx.answerCbQuery('⚠️ Животное не найдено');
  }

  // Рассчитываем максимальное количество и цены
  let currentCount = ctx.user[`${producerId}_count`] || 0;
  let totalPriceFor1 = 0;
  let totalPriceFor5 = 0;
  let totalPriceFor10 = 0;
  let maxCount = 0;
  let tempPrice = 0;
  
  // Рассчитываем цены для разных количеств
  for (let i = 0; i < 1000; i++) {
    const price = producer.basePrice * Math.pow(1.10, currentCount + i);
    tempPrice += price;
    
    if (i < 1) totalPriceFor1 = tempPrice;
    if (i < 5) totalPriceFor5 = tempPrice;
    if (i < 10) totalPriceFor10 = tempPrice;
    
    if (ctx.user.money >= tempPrice) {
      maxCount = i + 1;
    } else {
      break;
    }
  }

  // Формируем кнопки с ценами
  const buttons = [];
  [1, 5, 10].forEach(num => {
    const priceIndex = {1: 0, 5: 1, 10: 2}[num];
    const price = [totalPriceFor1, totalPriceFor5, totalPriceFor10][priceIndex];
    
    if (num <= maxCount && price) {
      buttons.push(Markup.button.callback(
        `${num} (${price.toFixed(0)}💰)`, 
        `buy:${producerId}:${num}`
      ));
    }
  });
  
  if (maxCount > 0) {
    let totalMaxPrice = 0;
    for (let i = 0; i < maxCount; i++) {
      totalMaxPrice += producer.basePrice * Math.pow(1.10, currentCount + i);
    }
    buttons.push(Markup.button.callback(
      `MAX (${maxCount}) ${totalMaxPrice.toFixed(0)}💰`, 
      `buy:${producerId}:${maxCount}`
    ));
  }

  await ctx.editMessageText(
    `Сколько ${producer.name} хотите купить?\n` +
    `Текущее количество: ${currentCount}\n` +
    `Цена следующего: ${(producer.basePrice * Math.pow(1.10, currentCount)).toFixed(2)}💰`,
    Markup.inlineKeyboard(buttons, { columns: 4 })
  );
});

// Обновляем обработчик покупки с правильным расчетом
bot.action(/^buy:(\w+):(\d+)$/, async (ctx) => {
  const producerId = ctx.match[1];
  const count = parseInt(ctx.match[2]);
  
  // Ищем производителя
  let producer;
  for (const cat of Object.values(ANIMAL_CATEGORIES)) {
    producer = cat.producers.find(p => p.id === producerId);
    if (producer) break;
  }
  
  if (!producer || count < 1) {
    return ctx.answerCbQuery('⚠️ Ошибка выбора');
  }

  // Рассчитываем точную стоимость
  let totalPrice = 0;
  let currentCount = ctx.user[`${producerId}_count`] || 0;
  for(let i = 0; i < count; i++) {
    totalPrice += producer.basePrice * Math.pow(1.10, currentCount + i);
  }
  totalPrice = parseFloat(totalPrice.toFixed(2));

  if (ctx.user.money < totalPrice) {
    return ctx.answerCbQuery('❌ Недостаточно средств');
  }

  // Обновляем данные
  ctx.user.money = parseFloat((ctx.user.money - totalPrice).toFixed(2));
  ctx.user[`${producerId}_count`] += count;
  await ctx.user.save();
  
  // Новая цена
  const nextPrice = producer.basePrice * Math.pow(1.10, currentCount + count);
  
  ctx.editMessageText(
    `✅ Куплено ${count} ${producer.name}\n` +
    `💰 Общая стоимость: ${totalPrice.toFixed(2)}💰\n` +
    `📉 Следующая цена: ${nextPrice.toFixed(2)}💰`
  );
  ctx.answerCbQuery();
});

// Добавляем обработчик кнопки "Дополнительно"
bot.hears('🔍 Дополнительно', (ctx) => {
  ctx.reply(
    '📂 Дополнительные функции:',
    Markup.inlineKeyboard([
      Markup.button.callback('🏆 Лидеры', 'show_leaders'),
      Markup.button.callback('🎁 Ежедневный бонус', 'daily_bonus'),
      Markup.button.callback('❓ Помощь', 'show_help')
    ], { columns: 2 })
  );
});

// Обновляем функцию getResourceName
const getResourceName = (resource) => {
  const names = {
    eggs: 'Яйца',
    feathers: 'Перья',
    down: 'Пух',
    wool: 'Шерсть',
    milk: 'Молоко',
    meat: 'Мясо'
  };
  return names[resource] || 'ресурса';
};

// Обновляем функцию handleDailyBonus
const handleDailyBonus = async (ctx) => {
  const user = ctx.user;
  const now = new Date();
  
  if (user.lastDailyBonus === null) {
    const fakeOldDate = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    user.lastDailyBonus = fakeOldDate;
    await user.save();
  }

  const lastBonus = new Date(user.lastDailyBonus);
  const nextBonusDate = new Date(lastBonus.getTime() + 24 * 60 * 60 * 1000);
  const hoursDiff = Math.floor((now - lastBonus) / (1000 * 60 * 60));
  
  if (hoursDiff < 24) {
    await ctx.deleteMessage();
    return ctx.replyWithMarkdown(
      `⏳ *Последнее получение:* ${lastBonus.toLocaleString('ru-RU')}\n` +
      `⌛ *Следующий бонус:* ${nextBonusDate.toLocaleString('ru-RU')}`
    );
  }

  const bonusAmount = Math.floor(Math.random() * 101) + 50;
  user.money += bonusAmount;
  user.lastDailyBonus = now;
  await user.save();

  console.log(`[DAILY] User ${ctx.from.id} (@${ctx.from.username || 'no_username'}) получил ${bonusAmount}💰`);
  await ctx.deleteMessage();
  ctx.replyWithMarkdown(
    `🎉 *Ежедневный бонус!*\n` +
    `💰 Вы получили: ${bonusAmount}💰\n` +
    `⏳ Следующий бонус: ${nextBonusDate.toLocaleString('ru-RU')}\n` +
    `💵 Новый баланс: ${user.money.toFixed(2)}💰`
  );
};

// Перенаправляем кнопку напрямую на обработку бонуса
bot.action('daily_bonus', handleDailyBonus);
bot.hears('🎁 Ежедневный бонус', handleDailyBonus);

// Исправляем обработчик кнопки продажи ресурсов
bot.action('open_sell_menu', async (ctx) => {
  await ctx.deleteMessage();
  
  // Копируем логику из основного обработчика
  ctx.replyWithMarkdown(
    `💰 *Выберите ресурс для продажи:*\n` +
    `Цены за 1 ед.:\n` +
    `🥚 Яйца: ${RESOURCE_PRICES.eggs}💰\n` +
    `🪶 Перья: ${RESOURCE_PRICES.feathers}💰\n` +
    `🛌 Пух: ${RESOURCE_PRICES.down}💰\n` +
    `🧶 Шерсть: ${RESOURCE_PRICES.wool}💰\n` +
    `🥛 Молоко: ${RESOURCE_PRICES.milk}💰\n` +
    `🥩 Мясо: ${RESOURCE_PRICES.meat}💰`,
    Markup.inlineKeyboard([
      Markup.button.callback('🥚 Яйца', 'sell_eggs'),
      Markup.button.callback('🪶 Перья', 'sell_feathers'),
      Markup.button.callback('🛌 Пух', 'sell_down'),
      Markup.button.callback('🧶 Шерсть', 'sell_wool'),
      Markup.button.callback('🥛 Молоко', 'sell_milk'),
      Markup.button.callback('🥩 Мясо', 'sell_meat'),
      Markup.button.callback('💥 Продать ВСЁ', 'sell_all')
    ], { columns: 3 })
  );
});

// Удаляем старые команды и заменяем их универсальными
bot.command('manage_resource', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const [action, userId, resource, amountStr] = ctx.message.text.split(' ').slice(1);
  const amount = parseFloat(amountStr);
  
  if (!['add', 'set', 'delete'].includes(action)) {
    return ctx.reply('❌ Неверное действие. Используйте: add/set/delete');
  }
  
  if (!RESOURCE_TYPES.includes(resource)) {
    return ctx.reply(`❌ Неверный ресурс. Допустимые: ${RESOURCE_TYPES.join(', ')}`);
  }
  
  const user = await User.findByPk(userId);
  if (!user) return ctx.reply('Пользователь не найден');
  
  switch(action) {
    case 'add':
      user[resource] += amount;
      break;
    case 'set':
      user[resource] = amount;
      break;
    case 'delete':
      user[resource] = Math.max(0, user[resource] - amount);
      break;
  }
  
  await user.save();
  
  ctx.reply(`✅ ${user.id} ${action} ${amount} ${resource}`);
  ctx.telegram.sendMessage(userId, 
    `Админ ${action === 'add' ? 'добавил' : action === 'set' ? 'установил' : 'удалил'} ` +
    `${amount} ${getResourceName(resource)}\nНовый баланс: ${user[resource].toFixed(2)}`
  );
});

bot.command('manage_money', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const [action, userId, amountStr] = ctx.message.text.split(' ').slice(1);
  const amount = parseFloat(amountStr);
  
  if (!['add', 'set', 'delete'].includes(action)) {
    return ctx.reply('❌ Неверное действие. Используйте: add/set/delete');
  }
  
  const user = await User.findByPk(userId);
  if (!user) return ctx.reply('Пользователь не найден');
  
  switch(action) {
    case 'add':
      user.money += amount;
      break;
    case 'set':
      user.money = amount;
      break;
    case 'delete':
      user.money = Math.max(0, user.money - amount);
      break;
  }
  
  await user.save();
  
  ctx.reply(`✅ ${user.id} ${action} ${amount}💰`);
  ctx.telegram.sendMessage(userId, 
    `Админ ${action === 'add' ? 'добавил' : action === 'set' ? 'установил' : 'удалил'} ` +
    `${amount}💰\nНовый баланс: ${user.money.toFixed(2)}`
  );
});

// Добавляем обработчик для manage_producer
bot.command('manage_producer', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const [action, userId, producerId, amountStr] = ctx.message.text.split(' ').slice(1);
  const amount = parseInt(amountStr);
  
  // Валидация параметров
  if (!['add', 'set', 'delete'].includes(action)) {
    return ctx.reply('❌ Неверное действие. Используйте: add/set/delete');
  }
  
  if (!PRODUCER_TYPES.includes(producerId)) {
    return ctx.reply(`❌ Неверный производитель. Допустимые:\n${PRODUCER_TYPES.join(', ')}`);
  }
  
  const user = await User.findByPk(userId);
  if (!user) return ctx.reply('❌ Пользователь не найден');
  
  const field = `${producerId}_count`;
  const currentCount = user[field] || 0;
  
  // Выполняем действие
  switch(action) {
    case 'add':
      user[field] += amount;
      break;
    case 'set':
      user[field] = Math.max(0, amount);
      break;
    case 'delete':
      user[field] = Math.max(0, currentCount - amount);
      break;
  }
  
  await user.save();
  
  // Получаем название производства
  const producerName = Object.values(ANIMAL_CATEGORIES)
    .flatMap(cat => cat.producers)
    .find(p => p.id === producerId)?.name || producerId;
  
  // Отправляем подтверждение
  ctx.replyWithMarkdown(
    `✅ *${action === 'add' ? 'Добавлено' : action === 'set' ? 'Установлено' : 'Удалено'}*` +
    `\n👤 Пользователь: ${userId}` +
    `\n🏭 Производство: ${producerName}` +
    `\n🛠 Действие: ${action}` +
    `\n🔢 Количество: ${amount}` +
    `\n📊 Текущее количество: ${user[field]}`
  );
  
  // Уведомляем пользователя
  ctx.telegram.sendMessage(
    userId,
    `Администратор ${action === 'add' ? 'добавил' : action === 'set' ? 'установил' : 'удалил'}` +
    ` ${amount} ${producerName}\nТеперь у вас: ${user[field]}`,
    { parse_mode: 'Markdown' }
  );
});

// Добавляем команду просмотра профиля пользователя
bot.command('user_info', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const [userId] = ctx.message.text.split(' ').slice(1);
  if (!userId) return ctx.reply('❌ Укажите ID пользователя: /user_info [ID]');

  try {
    const user = await User.findByPk(userId);
    if (!user) return ctx.reply('❌ Пользователь не найден');

    // Формируем информацию о ресурсах на русском
    const resources = RESOURCE_TYPES.map(res => {
      const emoji = {
        eggs: '🥚', feathers: '🪶', down: '🛌',
        wool: '🧶', milk: '🥛', meat: '🥩'
      }[res];
      return `${emoji} ${getResourceName(res)}: ${user[res].toFixed(2)}`;
    }).join('\n');

    // Формируем информацию о производствах с правильными названиями
    const producers = PRODUCER_TYPES.map(producerId => {
      const count = user[`${producerId}_count`] || 0;
      if (count === 0) return null;
      
      // Находим название производства
      const producer = Object.values(ANIMAL_CATEGORIES)
        .flatMap(cat => cat.producers)
        .find(p => p.id === producerId);
      
      return producer 
        ? `▫️ ${producer.name.replace(/_/g, '\\_')}: ${count} шт.`
        : null;
    }).filter(Boolean).join('\n') || 'Нет производств';

    // Форматируем даты
    const formatDate = (date) => date 
      ? new Date(date).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
      : 'Никогда';

    ctx.replyWithMarkdown(
      `*👤 Полный профиль пользователя ${userId}*\n\n` +
      `*Основные данные:*\n` +
      `▫️ 💰 Деньги: ${user.money.toFixed(2)}\n` +
      `▫️ 🕒 Последний сбор: ${formatDate(user.lastCollection)}\n` +
      `▫️ 🎁 Последний бонус: ${formatDate(user.lastDailyBonus)}\n\n` +
      `*Ресурсы:*\n${resources}\n\n` +
      `*Производства:*\n${producers}\n\n` +
      `*Системные данные:*\n` +
      `▫️ Дата регистрации: ${formatDate(user.createdAt)}`,
      { disable_web_page_preview: true }
    );

  } catch (error) {
    console.error(`[USER_INFO_ERROR] ${error}`);
    ctx.reply('❌ Ошибка при получении информации о пользователе');
  }
});

// Обновляем команду помощи админа
bot.command('admin_help', (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const resourcesList = RESOURCE_TYPES.map(r => `▫️ ${r} (${getResourceName(r)})`).join('\n');
  const producersList = PRODUCER_TYPES.map(p => `▫️ \`${p}\``).join('\n');
  
  ctx.replyWithMarkdown(
    `*🛠 Админ команды:*\n\n` +
    `*Универсальные команды:*\n` +
    `▫️ \`/manage_resource [add|set|delete] @user ресурс количество\`\n` +
    `▫️ \`/manage_money [add|set|delete] @user количество\`\n` +
    `▫️ \`/manage_producer [add|set|delete] @user producer_id количество\`\n\n` +
    `*Доступные ресурсы:*\n${resourcesList}\n\n` +
    `*Доступные производства:*\n${producersList}\n\n` +
    `*Новые команды:*\n` +
    `▫️ /user_info [ID] - полная информация о пользователе`,
    { disable_web_page_preview: true }
  );
});

// Добавляем синхронизацию базы данных перед запуском
bot.launch().then(() => console.log('Бот успешно запущен'));
