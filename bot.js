require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { Sequelize, DataTypes } = require('sequelize');

// Инициализация БД
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

// Модель пользователя
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  username: { type: DataTypes.STRING },
  firstName: { type: DataTypes.STRING },
  lastName: { type: DataTypes.STRING },
  eggs: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
  money: { type: DataTypes.DECIMAL(10, 2), defaultValue: 50.0 },
  lastCollection: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  chicken_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  duck_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  goose_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  cow_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  pig_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  sheep_count: { type: DataTypes.INTEGER, defaultValue: 0 }
});

// Обновляем конфиг животных
const ANIMALS = {
  chicken: {
    name: '🐔 Курица',
    price: 50,
    eggsPerMinute: 0.1,
    description: '6 яиц/час'
  },
  duck: {
    name: '🦆 Утка',
    price: 100, 
    eggsPerMinute: 0.3,
    description: '18 яиц/час'
  },
  goose: {
    name: '🦢 Гусь',
    price: 200,
    eggsPerMinute: 0.5,
    description: '30 яиц/час'
  },
  cow: {
    name: '🐄 Корова',
    price: 500,
    eggsPerMinute: 1,
    description: '60 яиц/час'
  },
  pig: {
    name: '🐖 Свинья',
    price: 1000,
    eggsPerMinute: 2,
    description: '120 яиц/час'
  },
  sheep: {
    name: '🐑 Овца',
    price: 300,
    eggsPerMinute: 0.7,
    description: '42 яйца/час'
  }
};

const bot = new Telegraf(process.env.BOT_TOKEN);

// Создаем клавиатуру
const gameKeyboard = Markup.keyboard([
  ['👤 Профиль', '🛒 Купить животное'],
  ['🥚 Собрать яйца', '💰 Продать яйца'],
  ['🏆 Лидеры', '❓ Помощь']
]).resize();

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
  await User.update({
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name
  }, { where: { id: ctx.from.id } });
  
  ctx.user = user[0];
  console.log(`Пользователь ${ctx.from.id} (${ctx.from.username}): ${user[1] ? 'создан' : 'найден'}`);
  return next();
});

// Команды бота
bot.start((ctx) => 
  ctx.replyWithMarkdown(
    `🎮 *Добро пожаловать на ферму!*\nНачальный капитал: ${ctx.user.money.toFixed(2)}💰`, 
    gameKeyboard
  )
);

bot.hears('👤 Профиль', async (ctx) => {
  console.log(`Просмотр профиля: ${ctx.from.id}`);
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
  const buttons = Object.entries(ANIMALS).map(([id, data]) => 
    Markup.button.callback(
      `${data.name} ${data.price}💰`,
      `buy_${id}`
    )
  );
  ctx.reply('Выберите животное:', Markup.inlineKeyboard(buttons, { columns: 2 }));
});

bot.hears('🥚 Собрать яйца', async (ctx) => {
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
    `💰 *Текущий баланс яиц:* ${ctx.user.eggs.toFixed(2)}\n` +
    `⏱ *Следующий сбор через:* 1 минуту`,
    gameKeyboard
  );
});

bot.hears('💰 Продать яйца', async (ctx) => {
  ctx.reply('Напишите "/sell_eggs количество" чтобы продать яйца', gameKeyboard);
});

bot.hears('🏆 Лидеры', async (ctx) => {
  try {
    // Получаем всех пользователей, отсортированных по деньгам
    const allUsers = await User.findAll({
      order: [['money', 'DESC']],
      attributes: ['id', 'money', 'username', 'firstName', 'lastName']
    });

    // Находим позицию текущего пользователя
    const userId = ctx.from.id;
    const userIndex = allUsers.findIndex(u => u.id === userId);
    const userPosition = userIndex >= 0 ? userIndex + 1 : 'Не в топе';

    // Формируем топ-10
    const top10 = allUsers.slice(0, 10).map((u, index) => {
      let name = u.username 
        ? `@${u.username}` 
        : [u.firstName, u.lastName].filter(Boolean).join(' ') 
          || `ID: ${u.id}`;
      
      return `${index + 1}. ${u.id === userId ? '👉 ' : ''}${name} - ${u.money.toFixed(2)}💰`;
    }).join('\n');

    ctx.replyWithMarkdown(
      `*🏆 Топ-10 фермеров:*\n\n${top10}\n\n` +
      `*Ваша позиция:* ${userPosition}\n` +
      `*Ваш баланс:* ${ctx.user.money.toFixed(2)}💰`
    );
  } catch (error) {
    console.error('Ошибка получения лидеров:', error);
    ctx.reply('⚠️ Не удалось загрузить таблицу лидеров');
  }
});

bot.hears('❓ Помощь', (ctx) => {
  console.log(`Запрос помощи: ${ctx.from.id}`);
  const animalsInfo = Object.entries(ANIMALS)
    .map(([_, data]) => 
      `▫️ <b>${data.name}</b> - ${data.description}\n   Цена: ${data.price}💰`
    )
    .join('\n');
  
  ctx.reply(
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
});

bot.command('sell_eggs', async (ctx) => {
  const [amount] = ctx.message.text.split(' ').slice(1);
  
  if (!amount) {
    return ctx.reply('❌ Укажите количество яиц для продажи\nПример: /sell_eggs 10');
  }
  
  const cleanAmount = amount.replace(',', '.');
  const eggsToSell = parseFloat(cleanAmount) || 0;
  
  if (eggsToSell <= 0) {
    return ctx.reply('❌ Укажите положительное число больше нуля\nПример: /sell_eggs 10');
  }
  
  if (ctx.user.eggs < eggsToSell) return ctx.reply(`Недостаточно яиц. У вас только ${ctx.user.eggs.toFixed(2)}🥚`);

  const oldEggs = ctx.user.eggs;
  const oldMoney = ctx.user.money;
  
  ctx.user.eggs -= eggsToSell;
  const moneyReceived = eggsToSell * 0.5;
  ctx.user.money = parseFloat((ctx.user.money + moneyReceived).toFixed(2));
  
  console.log('До продажи:', { eggs: oldEggs, money: oldMoney });
  console.log('После продажи:', { eggs: ctx.user.eggs, money: ctx.user.money });
  console.log(`Продажа: ${ctx.from.id} продал ${eggsToSell.toFixed(2)} яиц за ${moneyReceived.toFixed(2)}💰`);
  await ctx.user.save();
  
  ctx.reply(
    `Вы продали ${eggsToSell.toFixed(2)}🥚 и получили ${moneyReceived.toFixed(2)}💰\n` +
    `Теперь у вас:\nЯйца: ${ctx.user.eggs.toFixed(2)}🥚\nДеньги: ${ctx.user.money.toFixed(2)}💰`,
    gameKeyboard
  );
});

// Обработчик выбора животного
bot.action(/^buy_(\w+)$/, async (ctx) => {
  const animalId = ctx.match[1];
  const animal = ANIMALS[animalId];
  
  if (!animal) return ctx.answerCbQuery('⚠️ Животное не найдено');

  const maxCount = Math.floor(ctx.user.money / animal.price);
  if (maxCount < 1) {
    return ctx.answerCbQuery('❌ Недостаточно средств');
  }

  const buttons = [];
  [1, 10, 50].forEach(num => {
    if (num <= maxCount) {
      buttons.push(Markup.button.callback(num.toString(), `buy:${animalId}:${num}`));
    }
  });
  
  if (maxCount > 1) {
    buttons.push(Markup.button.callback(`MAX (${maxCount})`, `buy:${animalId}:${maxCount}`));
  }

  ctx.editMessageText(
    `Сколько ${animal.name} хотите купить? (Макс: ${maxCount})`,
    Markup.inlineKeyboard(buttons, { columns: 4 })
  );
});

// Обработчик подтверждения покупки
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
  await ctx.user.save();
  
  console.log(`Покупка: ${ctx.from.id} купил ${count} ${animal.name} за ${totalPrice}💰`);
  ctx.editMessageText(
    `✅ Успешно куплено ${count} ${animal.name} за ${totalPrice}💰\nНовый баланс: ${ctx.user.money.toFixed(2)}💰`
  );
  ctx.answerCbQuery();
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

// Запуск
(async () => {
  await sequelize.sync({ alter: true });
  bot.launch();
  console.log('Бот-ферма запущена!');
})();

process.once('SIGINT', () => {
  sequelize.close();
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  sequelize.close();
  bot.stop('SIGTERM');
});
