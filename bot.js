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
  duck_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  goose_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  cow_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  pig_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  sheep_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastDailyBonus: { type: DataTypes.DATE, defaultValue: null },
}, {
  tableName: 'Users' // Явно указываем имя таблицы
});

// Новый конфиг животных (отсортирован по стоимости)
const ANIMALS = {
  chicken: {
    name: '🐔 Курица',
    basePrice: 100,
    baseEggs: 1,
    description: '1 яйцо/мин'
  },
  duck: {
    name: '🦆 Утка',
    basePrice: 500,
    baseEggs: 6.5,
    description: '6.5 яиц/мин'
  },
  goose: {
    name: '🦢 Гусь',
    basePrice: 2000,
    baseEggs: 30,
    description: '30 яиц/мин'
  },
  sheep: {
    name: '🐑 Овца',
    basePrice: 5000,
    baseEggs: 100,
    description: '100 яиц/мин'
  },
  cow: {
    name: '🐄 Корова',
    basePrice: 25000,
    baseEggs: 650,
    description: '650 яиц/мин'
  },
  pig: {
    name: '🐖 Свинья',
    basePrice: 100000,
    baseEggs: 3000,
    description: '3000 яиц/мин'
  }
};

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
    ['🥚 Собрать яйца', '💰 Продать яйца'],
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
    `🎮 *Добро пожаловать на ферму!*\nНачальный капитал: ${ctx.user.money.toFixed(2)}💰`, 
    getMainKeyboard(ctx.user)
  )
});

bot.hears('👤 Профиль', async (ctx) => {
  console.log(`[PROFILE] User ${ctx.from.id} (@${ctx.from.username || 'no_username'})`);
  const user = ctx.user;
  let totalPerMinute = 0;
  
  const list = Object.entries(ANIMALS)
    .map(([id, animal]) => {
      const count = user[`${id}_count`];
      const production = getAnimalProduction(user, id) * count;
      totalPerMinute += production;
      return count > 0 ? 
        `${animal.name} ${count}шт. (${production.toFixed(1)}/мин)` : '';
    })
    .filter(Boolean)
    .join('\n') || 'У вас пока нет животных';
  
  ctx.replyWithMarkdown(
    `*👤 Ваш профиль*\n\n` +
    `🥚 *Яйца:* ${user.eggs.toFixed(2)}\n` +
    `💰 *Деньги:* ${user.money.toFixed(2)}\n` +
    `⚡ *Общая скорость:* ${totalPerMinute.toFixed(2)} яиц/мин\n` +
    `*Животные:*\n${list}`,
    getMainKeyboard(user)
  );
});

bot.hears('🛒 Купить животное', async (ctx) => {
  console.log(`[SHOP] User ${ctx.from.id} (@${ctx.from.username || 'no_username'})`);
  const sortedAnimals = Object.entries(ANIMALS).sort((a, b) => a[1].basePrice - b[1].basePrice);
  const buttons = sortedAnimals.map(([id, data]) => {
    const currentPrice = getAnimalPrice(ctx.user, id);
    return Markup.button.callback(
      `${data.name} ~${currentPrice}💰`,
      `buy_${id}`
    )
  });
  ctx.replyWithMarkdown(
    `*🛒 Магазин животных*\nВаш баланс: ${ctx.user.money.toFixed(2)}💰\nВыберите животное:`,
    Markup.inlineKeyboard(buttons, { columns: 2 })
  );
});

bot.hears('🥚 Собрать яйца', async (ctx) => {
  let totalEggs = 0;
  
  const now = new Date();
  const last = new Date(ctx.user.lastCollection);
  const minutes = Math.max(0, Math.floor((now - last) / 60000));
  
  console.log(`[COLLECT] User ${ctx.from.id} (@${ctx.from.username || 'no_username'}) начал сбор яиц`);
  
  Object.entries(ANIMALS).forEach(([id]) => {
    const count = ctx.user[`${id}_count`];
    let production = 0;
    for(let i = 0; i < count; i++) {
      production += ANIMALS[id].baseEggs / Math.pow(1.0035, i);
    }
    const eggs = production * minutes;
    console.log(`${ANIMALS[id].name}: ${count} * ${ANIMALS[id].baseEggs} * ${minutes} = ${eggs.toFixed(2)} яиц`);
    totalEggs += eggs;
  });

  console.log(`[COLLECT] User ${ctx.from.id} (@${ctx.from.username || 'no_username'}) всего яиц: ${totalEggs.toFixed(2)}`);

  if (totalEggs === 0) {
    return ctx.reply('Яйца еще не созрели! Проверьте наличие животных и подождите хотя бы 1 минуту', getMainKeyboard(ctx.user));
  }

  ctx.user.eggs = parseFloat((ctx.user.eggs + totalEggs).toFixed(2));
  ctx.user.lastCollection = now;
  await ctx.user.save();
  
  console.log(`[COLLECT] User ${ctx.from.id} (@${ctx.from.username || 'no_username'}) собрал ${totalEggs.toFixed(2)} яиц`);
  ctx.replyWithMarkdown(
    `🥚 *Собрано яиц:* ${totalEggs.toFixed(2)}\n` +
    `💰 *Текущее количество яиц:* ${ctx.user.eggs.toFixed(2)}\n`,
    getMainKeyboard(ctx.user)
  );
});

bot.hears('💰 Продать яйца', async (ctx) => {
  console.log(`[SELL] User ${ctx.from.id} (@${ctx.from.username || 'no_username'})`);
  ctx.replyWithMarkdown(
    `💰 *Продажа яиц*\n` +
    `Ваш баланс: ${ctx.user.eggs.toFixed(2)}🥚`,
    Markup.inlineKeyboard([
      Markup.button.callback('10🥚', 'sell_eggs_10'),
      Markup.button.callback('100🥚', 'sell_eggs_100'),
      Markup.button.callback('1000🥚', 'sell_eggs_1000'),
      Markup.button.callback(`ВСЕ (${ctx.user.eggs.toFixed(0)})`, 'sell_eggs_all')
    ], { columns: 2 })
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

// Выносим логику помощи в отдельную функцию
const handleHelp = (ctx) => {
  const animalsInfo = Object.entries(ANIMALS)
    .map(([_, data]) => 
      `▫️ <b>${data.name}</b> - ${data.description}\n   Базовая цена: ${data.basePrice}💰`
    )
    .join('\n');
  
  return ctx.reply(
    `<b>📚 Полное руководство по ферме</b>\n\n` +

    `<b>🎮 Основные механики:</b>\n` +
    `⏳ Яйца автоматически накапливаются со временем\n` +
    `📈 Цены животных растут на 5% за каждое купленное\n` +
    `📉 Продуктивность падает на 0.35% за каждое животное\n` +
    `🔄 Можно продавать яйца по курсу 1🥚 = 0.5💰\n\n` +

    `<b>📦 Производство яиц:</b>\n` +
    `• Собирайте яйца каждые 5+ минут\n` +
    `• Чем больше животных - тем выше доход\n` +
    `• Формула: (базовая продуктивность) × (кол-во) × (время в минутах)\n\n` +

    `<b>🏷️ Динамические цены:</b>\n` +
    `• Цена N-го животного = базовая × 1.05^N\n` +
    `• Пример: 10-я курица будет стоить ${Math.round(100 * Math.pow(1.05, 9))}💰\n\n` +

    `<b>📊 Продуктивность:</b>\n` +
    `• Продуктивность N-го животного = базовая / 1.0035^N\n` +
    `• Пример: 50-я курица даёт ${(1 / Math.pow(1.0035, 49)).toFixed(2)}🥚/мин\n\n` +

    `<b>🛒 Магазин животных:</b>\n${animalsInfo}\n\n` +

    `<b>🔁 Система обмена:</b>\n` +
    `• Минимальная сумма: 1💰\n` +
    `• Используйте /trade @username сумма\n` +
    `• Комиссия: 0%\n\n` +

    `<b>🏆 Рейтинг лидеров:</b>\n` +
    `• Обновляется в реальном времени\n` +
    `• Топ-10 игроков по балансу\n` +
    `• Ваша позиция отображается в профиле`,
    { 
      parse_mode: 'HTML',
      reply_markup: getMainKeyboard(ctx.user).reply_markup 
    }
  );
};

// Обновляем обработчики
bot.hears('❓ Помощь', handleHelp);

bot.action('show_help', async (ctx) => {
  console.log(`[HELP] User ${ctx.from.id} запросил справку`);
  await ctx.deleteMessage();
  await handleHelp(ctx);
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

// Команда добавления животных
bot.command('add_animal', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const [userId, animalId, count] = ctx.message.text.split(' ').slice(1);
  const user = await User.findByPk(userId);
  
  if (!user) return ctx.reply('Пользователь не найден');
  if (!ANIMALS[animalId]) return ctx.reply('Неверный тип животного');
  
  const field = `${animalId}_count`;
  user[field] += parseInt(count);
  await user.save();
  ctx.reply(`✅ ${user.id} получено ${count} ${ANIMALS[animalId].name}`);
  ctx.telegram.sendMessage(userId, `Получено ${count} ${ANIMALS[animalId].name} от Администратора\nТеперь у вас: ${user[field]}`);
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
  if (!ANIMALS[animalId]) return ctx.reply('Неверный тип животного');
  
  const field = `${animalId}_count`;
  user[field] = Math.max(0, parseInt(count));
  await user.save();
  ctx.reply(`✅ Для ${user.id} установлено ${count} ${ANIMALS[animalId].name}`);
  ctx.telegram.sendMessage(userId, `Администратор установил: ${count} ${ANIMALS[animalId].name}`);
});

// Команда удаления животных
bot.command('delete_animal', async (ctx) => {
  if (!isAdmin(ctx)) return;
  
  const [userId, animalId, count] = ctx.message.text.split(' ').slice(1);
  const user = await User.findByPk(userId);
  
  if (!user) return ctx.reply('Пользователь не найден');
  if (!ANIMALS[animalId]) return ctx.reply('Неверный тип животного');
  
  const field = `${animalId}_count`;
  user[field] = Math.max(0, user[field] - parseInt(count));
  await user.save();
  ctx.reply(`✅ У ${user.id} списано ${count} ${ANIMALS[animalId].name}`);
  ctx.telegram.sendMessage(userId, `Администратор списал: ${count} ${ANIMALS[animalId].name}\nОсталось: ${user[field]}`);
});

// Добавляем функции расчета цены и продуктивности
const getAnimalPrice = (user, animalId, currentCount = user[`${animalId}_count`]) => {
  const base = ANIMALS[animalId].basePrice;
  return Math.round(base * Math.pow(1.05, currentCount));
};

const getAnimalProduction = (user, animalId) => {
  const base = ANIMALS[animalId].baseEggs;
  const count = user[`${animalId}_count`];
  return base / Math.pow(1.0035, count);
};

// Добавляем обработчик выбора животного в магазине
bot.action(/^buy_(\w+)$/, async (ctx) => {
  const animalId = ctx.match[1];
  const animal = ANIMALS[animalId];
  
  if (!animal) return ctx.answerCbQuery('⚠️ Животное не найдено');

  const maxCount = Math.floor(ctx.user.money / getAnimalPrice(ctx.user, animalId));
  if (maxCount < 1) {
    return ctx.answerCbQuery('❌ Недостаточно средств');
  }

  const buttons = [];
  [1, 5, 10].forEach(num => {
    if (num <= maxCount) {
      buttons.push(Markup.button.callback(num.toString(), `buy:${animalId}:${num}`));
    }
  });
  
  if (maxCount > 1) {
    buttons.push(Markup.button.callback(`MAX (${maxCount})`, `buy:${animalId}:${maxCount}`));
  }

  await ctx.editMessageText(
    `Сколько ${animal.name} хотите купить? (Макс: ${maxCount})`,
    Markup.inlineKeyboard(buttons, { columns: 4 })
  );
});

// Обновляем обработчик выбора количества
bot.action(/^buy:(\w+):(\d+)$/, async (ctx) => {
  const animalId = ctx.match[1];
  const count = parseInt(ctx.match[2]);
  const animal = ANIMALS[animalId];
  
  if (!animal || count < 1) {
    return ctx.answerCbQuery('⚠️ Ошибка выбора');
  }

  // Рассчитываем общую стоимость
  let totalPrice = 0;
  for(let i = 0; i < count; i++) {
    const currentCount = ctx.user[`${animalId}_count`] + i;
    totalPrice += getAnimalPrice(ctx.user, animalId, currentCount);
  }

  if (ctx.user.money < totalPrice) {
    return ctx.answerCbQuery('❌ Недостаточно средств');
  }

  // Обновляем данные пользователя
  ctx.user.money = parseFloat((ctx.user.money - totalPrice).toFixed(2));
  ctx.user[`${animalId}_count`] += count;
  await ctx.user.save();
  
  // Рассчитываем следующую цену
  const nextPrice = getAnimalPrice(ctx.user, animalId, ctx.user[`${animalId}_count`]);
  
  ctx.editMessageText(
    `✅ Куплено ${count} ${animal.name}\n` +
    `💰 Общая стоимость: ${totalPrice}💰\n` +
    `📉 Следующая цена: ${nextPrice}💰`
  );
  ctx.answerCbQuery();
});

// Добавляем обработчик кнопки "Дополнительно"
bot.hears('🔍 Дополнительно', (ctx) => {
  console.log(`[MENU] User ${ctx.from.id} открыл дополнительные функции`);
  ctx.reply(
    '📂 Дополнительные функции:',
    Markup.inlineKeyboard([
      Markup.button.callback('🏆 Лидеры', 'show_leaders'),
      Markup.button.callback('❓ Помощь', 'show_help'),
      Markup.button.callback('🎁 Ежедневный бонус', 'show_daily_bonus'),
      Markup.button.callback('🔄 Обмен', 'show_trade_help')
    ], { columns: 2 })
  );
});

bot.action('show_trade_help', async (ctx) => {
  console.log(`[TRADE_HELP] User ${ctx.from.id} запросил помощь по обмену`);
  await ctx.deleteMessage();
  ctx.replyWithMarkdown(
    `*🔄 Система обмена*\n` +
    `Ваш баланс: ${ctx.user.money.toFixed(2)}💰\n\n` +
    `Для передачи денег другому игроку:\n` +
    `Напишите команду */trade @имя_игрока сумма*\n` +
    `\n` +
    `Например: */trade @username 500*\n\n` +
    `⚠️ *Ограничения:*\n` +
    `- Минимальная сумма: 1💰\n`
  );
});

// Добавляем новый обработчик для кнопок
bot.action(/^sell_eggs_(.+)$/, async (ctx) => {
  const amountType = ctx.match[1];
  const user = ctx.user;
  let eggsToSell = 0;

  switch(amountType) {
    case '10':
      eggsToSell = 10;
      break;
    case '100':
      eggsToSell = 100;
      break;
    case '1000':
      eggsToSell = 1000;
      break;
    case 'all':
      eggsToSell = user.eggs;
      break;
    default:
      return ctx.answerCbQuery('❌ Неверный выбор');
  }

  if (eggsToSell > user.eggs) {
    return ctx.answerCbQuery('❌ Недостаточно яиц');
  }

  const moneyEarned = eggsToSell * 0.5;
  user.eggs -= eggsToSell;
  user.money += moneyEarned;
  await user.save();

  ctx.editMessageText(
    `✅ Продано ${eggsToSell.toFixed(2)}🥚 за ${moneyEarned.toFixed(2)}💰\n` +
    `Новый баланс: ${user.eggs.toFixed(2)}🥚 | ${user.money.toFixed(2)}💰`
  );
  ctx.answerCbQuery();
});

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
  const hoursDiff = Math.floor((now - lastBonus) / (1000 * 60 * 60));
  
  if (hoursDiff < 24) {
    const remaining = 24 - hoursDiff;
    await ctx.deleteMessage();
    return ctx.replyWithMarkdown(
      `⏳ *Следующий бонус через ${remaining}ч*\n` +
      `⌛ Последнее получение: ${lastBonus.toLocaleString('ru-RU')}`
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
    `⏳ Следующий бонус: ${new Date(now.getTime() + 24 * 60 * 60 * 1000).toLocaleString('ru-RU')}\n` +
    `💵 Новый баланс: ${user.money.toFixed(2)}💰`
  );
};

// Обновляем обработчики после объявления функции
bot.action('daily_bonus', handleDailyBonus);
bot.hears('🎁 Ежедневный бонус', handleDailyBonus);

// Добавляем новый обработчик для кнопки бонуса в меню
bot.action('show_daily_bonus', async (ctx) => {
  await ctx.deleteMessage();
  ctx.replyWithMarkdown(
    '🎁 Нажмите кнопку ниже, чтобы получить ежедневный бонус',
    Markup.inlineKeyboard([
      Markup.button.callback('🎁 Получить бонус', 'daily_bonus')
    ])
  );
});

// Добавляем синхронизацию базы данных перед запуском
bot.launch().then(() => console.log('Бот успешно запущен'));
