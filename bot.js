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
  sheep_count: { type: DataTypes.INTEGER, defaultValue: 0 }
});

// Новый конфиг животных (отсортирован по стоимости)
const ANIMALS = {
  chicken: {
    name: '🐔 Курица',
    price: 100,
    eggsPerMinute: 1,
    description: '1 яйцо/мин'
  },
  duck: {
    name: '🦆 Утка',
    price: 500,
    eggsPerMinute: 6.5,
    description: '6.5 яиц/мин'
  },
  goose: {
    name: '🦢 Гусь',
    price: 2000,
    eggsPerMinute: 30,
    description: '30 яиц/мин'
  },
  sheep: {
    name: '🐑 Овца',
    price: 5000,
    eggsPerMinute: 100,
    description: '100 яиц/мин'
  },
  cow: {
    name: '🐄 Корова',
    price: 25000,
    eggsPerMinute: 650,
    description: '650 яиц/мин'
  },
  pig: {
    name: '🐖 Свинья',
    price: 100000,
    eggsPerMinute: 3000,
    description: '3000 яиц/мин'
  }
};

const bot = new Telegraf(process.env.BOT_TOKEN);

// Создаем клавиатуру
const gameKeyboard = Markup.keyboard([
  ['👤 Профиль', '🛒 Купить животное'],
  ['🥚 Собрать яйца', '💰 Продать яйца'],
  ['🔍 Дополнительно']
]).resize();

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
      lastName: ctx.from.last_name 
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
    gameKeyboard
  )
});

bot.hears('👤 Профиль', async (ctx) => {
  console.log(`[PROFILE] User ${ctx.from.id} (@${ctx.from.username || 'no_username'})`);
  const user = ctx.user;
  const list = Object.entries(ANIMALS)
    .map(([id, animal]) => {
      const count = user[`${id}_count`];
      return count > 0 ? `${animal.name} - ${count} шт.` : '';
    })
    .filter(Boolean)
    .join('\n') || 'У вас пока нет животных';
  
  ctx.replyWithMarkdown(
    `*👤 Ваш профиль*\n\n` +
    `🥚 *Яйца:* ${user.eggs.toFixed(2)}\n` +
    `💰 *Деньги:* ${user.money.toFixed(2)}\n` +
    `*Животные:*\n${list}`,
    gameKeyboard
  );
});

bot.hears('🛒 Купить животное', async (ctx) => {
  console.log(`[SHOP] User ${ctx.from.id} (@${ctx.from.username || 'no_username'})`);
  const sortedAnimals = Object.entries(ANIMALS).sort((a, b) => a[1].price - b[1].price);
  const buttons = sortedAnimals.map(([id, data]) => 
    Markup.button.callback(
      `${data.name} ${data.price}💰`,
      `buy_${id}`
    )
  );
  ctx.replyWithMarkdown(
    `*🛒 Магазин животных*\nВаш баланс: ${ctx.user.money.toFixed(2)}💰\nВыберите животное:`,
    Markup.inlineKeyboard(buttons, { columns: 2 })
  );
});

bot.hears('🥚 Собрать яйца', async (ctx) => {
  console.log(`[COLLECT] User ${ctx.from.id} (@${ctx.from.username || 'no_username'})`);
  const now = new Date();
  const last = new Date(ctx.user.lastCollection);
  const minutes = Math.max(0, Math.floor((now - last) / 60000));
  
  console.log(`Время с последнего сбора: ${minutes} минут`);
  console.log('Последнее время сбора:', ctx.user.lastCollection);
  console.log('Текущее время:', now);

  let totalEggs = 0;
  Object.entries(ANIMALS).forEach(([id, animal]) => {
    const count = ctx.user[`${id}_count`];
    const eggs = count * animal.eggsPerMinute * minutes;
    console.log(`${animal.name}: ${count} * ${animal.eggsPerMinute} * ${minutes} = ${eggs.toFixed(2)} яиц`);
    totalEggs += eggs;
  });

  console.log('Всего собрано яиц:', totalEggs.toFixed(2));

  if (totalEggs === 0) {
    return ctx.reply('Яйца еще не созрели! Проверьте наличие животных и подождите хотя бы 1 минуту', gameKeyboard);
  }

  ctx.user.eggs = parseFloat((ctx.user.eggs + totalEggs).toFixed(2));
  ctx.user.lastCollection = now;
  await ctx.user.save();
  
  console.log(`Сбор яиц: ${ctx.from.id} собрал ${totalEggs.toFixed(2)} яиц`);
  ctx.replyWithMarkdown(
    `🥚 *Собрано яиц:* ${totalEggs.toFixed(2)}\n` +
    `💰 *Текущее количество яиц:* ${ctx.user.eggs.toFixed(2)}\n`,
    gameKeyboard
  );
});

bot.hears('💰 Продать яйца', async (ctx) => {
  console.log(`[SELL] User ${ctx.from.id} (@${ctx.from.username || 'no_username'})`);
  ctx.reply(
    `💰 Продажа яиц\n` +
    `Ваш баланс: ${ctx.user.eggs.toFixed(2)}🥚\n` +
    `Напишите "/sell_eggs количество" чтобы продать яйца`,
    gameKeyboard
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
    console.error('Ошибка получения лидеров:', error);
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
      `▫️ <b>${data.name}</b> - ${data.description}\n   Цена: ${data.price}💰`
    )
    .join('\n');
  
  return ctx.reply(
    `<b>🐔 Ферма помощи</b>\n\n` +
    `<b>Экономика:</b>\n` +
    `🥚 1 яйцо = 0.5💰\n\n` +
    `<b>Доступные животные:</b>\n${animalsInfo}\n\n` +
    `<b>Основные команды:</b>\n` +
    `👉 Профиль 👤 - ваш баланс и животные\n` +
    `👉 Купить животное 🛒 - расширение фермы\n` +
    `👉 Собрать яйца 🥚 - получение дохода\n` +
    `👉 Продать яйца 💰 - конвертация в деньги`,
    { 
      parse_mode: 'HTML',
      reply_markup: gameKeyboard.reply_markup 
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
  console.log(`[TRADE_ATTEMPT] User ${ctx.from.id} пытается передать деньги`);
  const [targetUsername, amountStr] = ctx.message.text.split(' ').slice(1);
  
  // Проверка аргументов
  if (!targetUsername || !amountStr) {
    return ctx.replyWithMarkdown(
      `❌ *Использование:*\n` +
      `/trade @имя_пользователя сумма\n` +
      `Пример: /trade @username 100`
    );
  }

  // Парсим сумму
  const amount = parseFloat(amountStr.replace(',', '.'));
  if (isNaN(amount) || amount <= 0) {
    return ctx.reply('❌ Укажите корректную сумму больше нуля');
  }

  // Проверяем получателя
  const cleanUsername = targetUsername.replace('@', '');
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

    console.log(`[TRADE_SUCCESS] User ${ctx.from.id} передал ${amount}💰 пользователю ${receiver.id}`);

  } catch (error) {
    console.error(`[TRADE_FAIL] User ${ctx.from.id}: ${error.message}`);
    ctx.reply('❌ Произошла ошибка при выполнении перевода');
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

// Команда продажи яиц
bot.command('sell_eggs', async (ctx) => {
  const [amount] = ctx.message.text.split(' ').slice(1);
  
  if (!amount) {
    return ctx.reply('❌ Укажите количество яиц для продажи\nПример: /sell_eggs 10');
  }

  const user = ctx.user;
  const eggsToSell = parseFloat(amount);
  
  if (eggsToSell > user.eggs) {
    return ctx.reply('❌ Недостаточно яиц для продажи');
  }

  const moneyEarned = eggsToSell * 0.5;
  user.eggs -= eggsToSell;
  user.money += moneyEarned;
  await user.save();
  
  ctx.reply(`✅ Вы продали ${eggsToSell} яиц за ${moneyEarned.toFixed(2)}💰`);
});

// Исправляем обработчик выбора животного
bot.action(/^buy_(\w+)$/, async (ctx) => {
  const animalId = ctx.match[1];
  const animal = ANIMALS[animalId];
  
  if (!animal) return ctx.answerCbQuery('⚠️ Животное не найдено');

  const maxCount = Math.floor(ctx.user.money / animal.price);
  if (maxCount < 1) {
    return ctx.answerCbQuery('❌ Недостаточно средств');
  }

  const buttons = [];
  [1, 5, 10].forEach(num => { // Изменены варианты выбора количества
    if (num <= maxCount) {
      buttons.push(Markup.button.callback(num.toString(), `buy:${animalId}:${num}`));
    }
  });
  
  if (maxCount > 1) {
    buttons.push(Markup.button.callback(`MAX (${maxCount})`, `buy:${animalId}:${maxCount}`));
  }

  await ctx.editMessageText( // Добавлен await
    `Сколько ${animal.name} хотите купить? (Макс: ${maxCount})`,
    Markup.inlineKeyboard(buttons, { columns: 4 })
  );
});

// Исправляем обработчик подтверждения покупки
bot.action(/^buy:(\w+):(\d+)$/, async (ctx) => {
  const animalId = ctx.match[1];
  const count = parseInt(ctx.match[2]);
  const animal = ANIMALS[animalId];
  
  if (!animal || count < 1) {
    return ctx.answerCbQuery('⚠️ Ошибка выбора');
  }

  const totalPrice = animal.price * count;
  if (ctx.user.money < totalPrice) {
    return ctx.answerCbQuery('❌ Недостаточно средств');
  }

  ctx.user.money = parseFloat((ctx.user.money - totalPrice).toFixed(2));
  ctx.user[`${animalId}_count`] += count;
  await ctx.user.save(); // Добавлен await
  
  ctx.editMessageText(
    `✅ Успешно куплено ${count} ${animal.name} за ${totalPrice}💰\nНовый баланс: ${ctx.user.money.toFixed(2)}💰`
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

bot.launch();
