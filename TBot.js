const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');

const bot = new TelegramBot('YOUR_BOT_TOKEN', { polling: true });

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: '--base',
  password: '--pass',
  port: 5432,
});

function askQuestion(chatId, question) {
  // bot.sendMessage(chatId, question);  
  setTimeout(() => { 
    bot.sendMessage(chatId, question) 
  }, 2000);
  return new Promise((resolve) => {
      bot.on('message', (msg) => {
        if (msg.chat.id === chatId) {
          resolve(msg.text);
        }
      });
    });
  }

    
  function askQuestionInt(chatId, question) {
    return new Promise((resolve) => {
      // bot.sendMessage(chatId, question);
      setTimeout(() => { 
        bot.sendMessage(chatId, question) 
      }, 2000);
      bot.on('message', function onMessage(msg) {
        if (msg.chat.id === chatId) {
          const input = msg.text.trim();
  
          // Проверяем, что введенные данные состоят только из цифр и не превышают 10 символов
          if (/^\d{1,10}$/.test(input)) {
            // Удаляем обработчик сообщений, чтобы не накапливать лишние обработчики
            bot.removeListener('message', onMessage);
            resolve(input);
          } else {
            setTimeout(() => {
              bot.sendMessage(chatId, 'Невірний формат вводу. Введіть тільки числа, не більше 10, дякуємо!')
            }, 2000);
          }
        }
      });
    });
  }
  
function askQuestion1(chatId) {
  bot.sendMessage(chatId, '<pre> </pre>\tПерш за все, нам необхідно отримати Вашу згоду на обробку Ваших персональних даних.\n\tНовокаховська МВА може збирати, зберігати та обробляти Ваші персональні дані з метою надання допомоги. Ця анкета збирає деякі Ваші персональні дані, які будуть зашифровані та можуть бути використані виключно співробітниками Новокаховська МВА. Ця інформація збирається з метою оцінити Вашу потребу у допомозі, але не гарантує її.', {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Даю згоду', callback_data: 'question1_yes' },
          { text: 'Не погоджуюсь', callback_data: 'question1_no' }
        ]
      ]
    }
  });
}

function askQuestion2(chatId) {
  bot.sendMessage(chatId, '<b>Виберіть послугу</b>', {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [  { text: 'Зв’язатися з військовою адміністрацією', callback_data: 'question2_adm' }
            ],
        [  { text: 'Отримати допомогу', callback_data: 'question2_inhelp' }
            ],
        [  { text: 'Передати допомогу ', callback_data: 'question2_outhelp' }
            ],
        [  { text: 'Заявка на евакуацію ', callback_data: 'question2_evac' }
            ],
        [  { text: 'Повідомити про потреби', callback_data: 'question2_inhelp2'}
            ],
        [  { text: 'Корисні контакти', callback_data: 'question2_cont' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    }, disable_web_page_preview: true
  });
}

async function askQuestionEnd(chatId) {
  bot.sendMessage(chatId, 'Ваше звернення зареєстровано! Очікуйте, наші фахівці найближчим часом зв’яжуться з Вами! Бажаєте провести іншу реєстрацію, нажміть - "Додаткове опитування", або закінчити опитування - Закінчити опитування"Ні".', {
    reply_markup: {
      keyboard: [
        [{ text: "Додаткове опитування" }],
        [{ text: "Закінчити опитування" }]
           ],
    resize_keyboard: true,
    one_time_keyboard: true
    }
  });
  const messageListener = (msg) => {
  const receivedChatId = msg.chat.id;
  const receivedUserId = msg.from.id;
  if (receivedChatId !== chatId) {
    // Если сообщение не из нужного чата, то пропускаем его
    return;
  }
  if (msg.text === 'Додаткове опитування') {
    bot.sendMessage(chatId, 'Давайте почнемо опитування!', {
      reply_markup: {
        remove_keyboard: true
      }
    });
    askQuestion2(chatId);
    bot.off('message', messageListener); // отписываемся от события после успешного получения ответа
  } else if (msg.text === 'Закінчити опитування') {
      setTimeout(() => { 
        bot.sendMessage(chatId, 'Дякуємо за звернення. Чат закрито. За необхідністю додаткового зверненя, відправте боту слово - Повторити', {
          reply_markup: {
            remove_keyboard: true
          }
        });
      }, 2000);
    
    bot.off('message', messageListener);
    
  }
};
bot.on('message', messageListener);
} 

function getCurrentDateTime() {
  const now = new Date();
  const currentDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const currentTime = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  return {currentDate, currentTime };
}


// обработчик ошибок
bot.on('error', (err) => {
  const errorData = {
    message: err.message,
    stack: err.stack
  };
  logEvent(null, 'error', errorData);
});

// функция записи лога в базу данных
function logEvent(chatId, eventType, eventData) {
    const event_date = getCurrentDateTime().currentDate;
    const event_time = getCurrentDateTime().currentTime;
    const sql = `
      INSERT INTO bot_logs (chat_id, event_data, event_type, event_date, event_time)
      VALUES ($1, $2, $3, $4, $5)
     `;
  const values = [chatId, eventData, eventType, event_date, event_time];
 /*  if (chatId) {
    values.unshift(chatId);
    sql.replace('(event_time,', '(chat_id, event_time,');
  } */
  pool.query(sql, values, (err, res) => {
    if (err) {
      console.error('Error inserting log into database:', err);
    }
  });
}

async function registerUserAdm(chatId) {
    const fullName = await askQuestion(chatId, 'Спочатку розкажіть трохи про себе. Введіть Ваше ПІБ за зразком - Кравченко Сергій Петрович');
    const fone = await askQuestionInt(chatId, 'Вкажіть Ваш контактний номер телефону за зразком 0502235478');
    const textHelp = await askQuestion(chatId, 'Напишіть Ваше звернення/повідомлення');
    const registrationDate = getCurrentDateTime().currentDate;
    const registrationTime = getCurrentDateTime().currentTime;
    
    const messageData = `1-${chatId}, ${fullName}, ${fone}, ${textHelp}, ${registrationDate}, ${registrationTime}, ${firstName}, ${lastName}`;
        
    const query = {
        text: 'INSERT INTO useradm(fullName, fone, textHelp, chat_id, reg_date, reg_time) VALUES($1, $2, $3, $4, $5, $6)',
        values: [fullName, fone, textHelp, chatId, registrationDate, registrationTime],
      };          
      
      pool.query(query, (err, res) => {
        if (err) {
          console.error(err.stack);
          logEvent(chatId, 'error_data', messageData); 
          bot.sendMessage(chatId, 'Ваше звернення не зареєстровано! Вибачте, заповніть повторно заявку, можливо сталась помилка. Відправте  боту слово  - Повторити.');
        } else {
          logEvent(chatId, 'message', messageData); // запись лога в базу данных 
          console.log(chatId,'- Data has been saved to the database - ', registrationTime);
        askQuestionEnd(chatId);
        }
      });      
  }

async function registerUserInHelp(chatId) {
    
    const fullName = await askQuestion(chatId, 'Введіть Ваше ПІБ за зразком - Кравченко Сергій Петрович');
    const ipn = await askQuestionInt(chatId, 'Будь ласка, вкажіть Ваш ідентифікаційний номер  у форматі ХХХХХХХХХХ');
    const document = await askQuestion(chatId, 'Вкажіть наявні документи: \n1.ВПО (номер і дату видачі) \n2.Паспортні данні (серія, номер, орган що видав і дата видачі)');
    const fone = await askQuestionInt(chatId, 'Вкажіть номер мобільного телефону особи на яку подається заявка (тільки для повнолітніх осіб, на дітей - вказуємо номер когось з батьків або опікуна) за зразком 0502235478');
    const countPeople = await askQuestion(chatId, 'Вкажіть кількість членів вашої родини з якими Ви проживаєте, включно з Вами (тільки цифра)');
    const address = await askQuestion(chatId, 'Вкажіть Вашу адресу за місцем прописки.');
    const address_cur = await askQuestion(chatId, 'Адреса тимчасової реєстрації, за довідкою ВПО (Область-населений пункт-адреса)');
    const charactHelp = await askQuestion(chatId, 'Опишіть, яку допомогу Ви потребуєте');
    const sgroup = await askQuestion(chatId, 'Чи відноситесь ви до пільгової категорії (багатодітні сім’ї, особи з інвалідністю I та II групи за наявністю відповідного документу, люди похилого віку (60+), родини з неповнолітніми дітьми, вагітні-годуючи мами, люди з хронічними, важкими хворобами або інвалідністю)? \nЯкщо так, то вкажіть категорію, якщо ні - напишіть немає.');
    const address_np = await askQuestion(chatId, 'Адреса Нової Пошти, номер відділення, отримувача.');
    const registrationDate = getCurrentDateTime().currentDate;
    const registrationTime = getCurrentDateTime().currentTime;

    const messageData = `2-${chatId}, ${fullName}, ${ipn}, ${document}, ${fone}, ${countPeople}, ${address}, ${address_cur}, ${charactHelp}, ${sgroup}, ${address_np}, ${registrationDate}, ${registrationTime}, ${firstName}, ${lastName}`;
        
    const query = {
        text: 'INSERT INTO userinhelp(fullName, ipn, document, fone, countPeople, address, address_cur, charactHelp, social_group, address_np, chat_id, reg_date, reg_time) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
        values: [fullName, ipn, document, fone, countPeople, address, address_cur, charactHelp, sgroup, address_np, chatId, registrationDate, registrationTime],
      };     

      pool.query(query, (err, res) => {
        if (err) {
          console.error(err.stack);
          logEvent(chatId, 'error_data', messageData);
          bot.sendMessage(chatId, 'Ваше звернення не зареєстровано! Вибачте, заповніть повторно заявку, можливо сталась помилка. Відправте  боту слово  - Повторити.');
        } else {
          logEvent(chatId, 'message', messageData); // запись лога в базу данных 
          console.log(chatId,'- Data has been saved to the database - ', registrationTime);
          askQuestionEnd(chatId);
        }
      });
  }

async function registerOutHelp(chatId) {
    const fullName = await askQuestion(chatId, 'Тут ви можете передати допомогу (документи та ліки) для мешканців Козацького та Веселого. Спочатку розкажіть трохи про себе. Введіть Ваше ПІБ за зразком - Кравченко Сергій Петрович');
    const fone = await askQuestionInt(chatId, 'Вкажіть Ваш контактний номер телефону за зразком 0502235478');
    const textOutHelp = await askQuestion(chatId, 'Опишіть яку допомогу та в якому обсязі Ви можете надати');
    const registrationDate = getCurrentDateTime().currentDate;
    const registrationTime = getCurrentDateTime().currentTime;
    
    const messageData = `3-${chatId}, ${fullName}, ${fone}, ${textOutHelp}, ${registrationDate}, ${registrationTime}, ${firstName}, ${lastName}`;
    
    const query = {
        text: 'INSERT INTO outhelp(fullName, fone, textOutHelp, chat_id, reg_date, reg_time) VALUES($1, $2, $3, $4, $5, $6)',
        values: [fullName, fone, textOutHelp, chatId, registrationDate, registrationTime],
      };      
      
      pool.query(query, (err, res) => {
        if (err) {
          console.error(err.stack);
          logEvent(chatId, 'error_data', messageData);
          bot.sendMessage(chatId, 'Ваше звернення не зареєстровано! Вибачте, заповніть повторно заявку, можливо сталась помилка. Відправте  боту слово  - Повторити.');
        } else {
          logEvent(chatId, 'message', messageData); // запись лога в базу данных 
          console.log(chatId,'- Data has been saved to the database - ', registrationTime);
          askQuestionEnd(chatId);
        }
      });
  }

async function registerUserEvac(chatId) {
      
    const fullName = await askQuestion(chatId, 'Тут ви можете залишити заявку на евакуацію мешканців Козацького та Веселого. Вкажіть ПІБ особи чи осіб, яких необхідно евакуювати.');
    const fone = await askQuestionInt(chatId, 'Вкажіть контактний номер телефону осіб евакуації, за зразком 0502235478.');
    const countPeople = await askQuestion(chatId, 'Вкажіть кількість осіб евакуації.');
    const address = await askQuestion(chatId, 'Вкажіть населений пункт місцезнаходження осіб, які потребують евакуації.');
    const registrationDate = getCurrentDateTime().currentDate;
    const registrationTime = getCurrentDateTime().currentTime;
    
    const messageData = `4-${chatId}, ${fullName}, ${fone}, ${countPeople}, ${address}, ${registrationDate}, ${registrationTime}, ${firstName}, ${lastName}`;
    
    const query = {
        text: 'INSERT INTO userevac(fullName, fone, countPeople, address, chat_id, reg_date, reg_time) VALUES($1, $2, $3, $4, $5, $6, $7)',
        values: [fullName, fone, countPeople, address, chatId, registrationDate, registrationTime],
      };      

      pool.query(query, (err, res) => {
        if (err) {
          console.error(err.stack);
          logEvent(chatId, 'error_data', messageData);
          bot.sendMessage(chatId, 'Ваше звернення не зареєстровано! Вибачте, заповніть повторно заявку, можливо сталась помилка. Відправте  боту слово  - Повторити.');
        } else {
          logEvent(chatId, 'message', messageData); // запись лога в базу данных 
          console.log(chatId,'- Data has been saved to the database - ', registrationTime);
          askQuestionEnd(chatId);
        }
      });
  }

async function registerUserInHelp2(chatId) {
    
    const fone0 = await askQuestionInt(chatId, 'Вкажіть Ваш номер мобільного телефону (заповнювач заявки) за зразком 0502235478');
    const fullName = await askQuestion(chatId, 'Введіть ПІБ особи яка потребує допомоги.');
    const fone = await askQuestionInt(chatId, 'Вкажіть номер мобільного телефону (одержувача допомоги), за можливості.');
    const address = await askQuestion(chatId, 'Вкажіть адресу місцеперебування особи, яка потребуює допомоги.');
    const charactHelp = await askQuestion(chatId, 'Опишіть якої допомоги потребує ця особа.');
    const registrationDate = getCurrentDateTime().currentDate;
    const registrationTime = getCurrentDateTime().currentTime;
    
    const messageData = `5-${chatId}, ${fone0}, ${fullName}, ${fone}, ${address}, ${charactHelp}, ${registrationDate}, ${registrationTime}, ${firstName}, ${lastName}`;
    
    const query = {
        text: 'INSERT INTO userinhelp2(fone0, fullName, fone, address, characthelp, chat_id, reg_date, reg_time) VALUES($1, $2, $3, $4, $5, $6, $7, $8)',
        values: [fone0, fullName, fone, address, charactHelp, chatId, registrationDate, registrationTime],
      };      

      pool.query(query, (err, res) => {
        if (err) {
          console.error(err.stack);
          logEvent(chatId, 'error_data', messageData);
          bot.sendMessage(chatId, 'Ваше звернення не зареєстровано! Вибачте, заповніть повторно заявку, можливо сталась помилка. Відправте  боту слово  - Повторити.');
        } else {
          logEvent(chatId, 'message', messageData); // запись лога в базу данных 
          console.log(chatId,'- Data has been saved to the database - ', registrationTime);
          askQuestionEnd(chatId);
        }
      });
  }

  function registerContacts(chatId) {
    const messageData = `6-${firstName}, ${lastName}`; 
    bot.sendMessage(chatId, '<pre> </pre><b>Корисні контакти</b>\n \n- Урядова гаряча лінія Херсонський контактний центр <u>0800504077</u>\n \n- Гаряча лінія Новокаховської МВА <u>0 800 335 180</u>\n \n- Прямий контакт у Telegram для тих, хто на окупованій території <u>+380 (73) 864 74 01</u>\n \n- Електронна пошта Новокаховської МВА <u>nkmva22@gmail.com</u>\n \n- Заявка на евакуацію <u>+380502822726</u>\n \n- Гуманітарний центр у Кривому Розі <u>+380660267252</u>\n \n- Психологічна допомога від Національної психологічної асоціації <u>0800100102</u>\n \n- Гаряча лінія для учасників війни та їхніх родичів <u>0800501212</u>\n \n- Гаряча лінія психологічної допомоги для учасників АТО (ООС) та членів їхніх сімей <u>0800505085</u>\n \n- Система надання безоплатної правової допомоги <u>0800213103</u>\n \n- СБУ <u>0800500021</u>\n', {parse_mode: "HTML"});
        
    setTimeout(() => { 
    console.log('6-',chatId);   
    bot.sendMessage(chatId, 'Дякуємо за звернення. У подальшому за необхідністю додаткового зверненя, відправте  боту слово  - Повторити.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Повторити', callback_data: 'call_function_askQuestion2' }]
        ]
      }
    });
    }, 3000);
    logEvent(chatId, 'inf_request', messageData); 
    /* setTimeout(() => { 
      bot.sendMessage(chatId, 'За необхідністю додаткового зверненя, відправте боту слово - Повторити') 
    }, 2000); */
  }
  
  let callbackQueryHandlerSet = false;
  let chatId;
  let firstName;
  let lastName;
  function startBot() {    
    if (!callbackQueryHandlerSet) {
      bot.on('callback_query', handleCallbackQuery);
      callbackQueryHandlerSet = true;
    }
  
    bot.onText(/\/start|Повторити/, (msg) => {
      chatId = msg.chat.id;
      firstName = msg.from.first_name || 'no first name';
      lastName = msg.from.last_name || 'no last name';
      let messageId = msg.message_id;
      bot.sendMessage(chatId, '<pre> </pre><b>\tВітаємо!</b>\n\tВи звернулись до чат-боту Новокаховської МВА. Просимо вас бути уважними при заповнені даних. У випадку, якщо Вам не вдалося завершити та подати заявку - повідомте про проблему @novakakhovka_mva', {parse_mode: "HTML"});
      setTimeout(() => {
        // bot.deleteMessage(chatId, messageId);
        askQuestion1(chatId);
      }, 2000); 
    });
  }
  
  function handleCallbackQuery(callbackQuery) {
    const callbackchatId = callbackQuery.message.chat.id;
    if (callbackchatId !== chatId) {
      return;
    }
    const answer = callbackQuery.data;
       
    switch (answer) {
      case 'question1_yes':
        setTimeout(() => {
          askQuestion2(chatId);
        }, 2000); 
          break;
      case 'question2_adm':
          registerUserAdm(chatId)
          break;
      case 'question2_inhelp':
        bot.sendMessage(chatId, '<pre> </pre>\tТут Ви можете подати заявку на гуманітарну допомогу мешканців Новокаховської МТГ, які знаходяться виключно на підконтрольній території України! \n <pre></pre><b> Увага!!!</b>\n Заявка на гуманітарну допомогу заповнюється на кожного члена родини ОКРЕМО (після заповнення першої заявки натисніть «Додаткове опитування» та заповніть таким чином необхідну кількість заяв).\n Однак у полі кількість членів родини та адреса Нової пошти, номер відділення та отримувач, будь ласка вказуйте однакову інформацію - голови Вашої сім’ї, який/яка отримуватиме допомогу!', {parse_mode: "HTML"}); 
        setTimeout(() => {
          registerUserInHelp(chatId); 
        }, 2000);
          break;
      case 'question2_outhelp':
        registerOutHelp(chatId);
          break;
      case 'question2_evac':
        registerUserEvac(chatId);
          break;
      case 'question2_inhelp2':
        bot.sendMessage(chatId, '<pre> </pre>\tТут Ви можете подати дані про осіб особливо уразливих категорій, які потребують допомоги у перші дні деокупації територій Новокаховської міської територіальної громади.', {parse_mode: "HTML"});
        setTimeout(() => {
          registerUserInHelp2(chatId); 
        }, 2000);      
          break;
      case 'question2_cont':
        registerContacts(chatId);
          break;
      case 'call_function_askQuestion2':
        askQuestion2(chatId);
          break;     
      case 'question1_no':
          bot.sendMessage(chatId, 'Перепрошуємо! Без згоди ми не маємо право провести опитування!');
          break;
    }
  }
  startBot();
    
  