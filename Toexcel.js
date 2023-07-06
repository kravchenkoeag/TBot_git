const { Pool } = require('pg');
const ExcelJS = require('exceljs');
const moment = require('moment');
const fs = require('fs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: '--base',
  password: '--pass',
  port: 5432,
});

async function saveTableToExcel(table, worksheet, registrationDate) {
  try {
    let query = `SELECT * FROM ${table}`;
    if (registrationDate) {
      query = `SELECT * FROM ${table} WHERE reg_date = TO_DATE('${registrationDate}', 'DD.MM.YYYY')`;
    }
    const result = await pool.query(query);
    const rows = result.rows;
    if (!rows.length) {
      console.log(`Для таблицы ${table} не найдено записей за дату ${registrationDate}`);
      return;
    }
    const columns = Object.keys(rows[0]);
    
    console.log(`Из таблицы ${table} извлечено ${rows.length} строк.`);
    
    const headerRow = worksheet.addRow(columns);
    headerRow.font = { bold: true };
    
    for (let i = 0; i < rows.length; i++) {
      const values = Object.values(rows[i]);
      worksheet.addRow(values);
    }

    for (let i = 1; i <= worksheet.columnCount; i++) {
      worksheet.getColumn(i).width = 30;
    }

  } catch (err) {
    console.error(err);
  }
}

async function main() {
  const workbook = new ExcelJS.Workbook();
  const worksheet1 = workbook.addWorksheet('Запит в адм.');
  const worksheet2 = workbook.addWorksheet('Реєстрація на допомогу');
  const worksheet3 = workbook.addWorksheet('Передати допомогу');
  const worksheet4 = workbook.addWorksheet('Заявка на евакуацію');
  const worksheet5 = workbook.addWorksheet('Реєстрація в окуп. тер.');
  
  // const args = process.argv.slice(2);  
  let registrationDate;
  if (process.argv.length > 2) {
    registrationDate = process.argv[2];
  }
  // const now = new Date();
  // const registrationDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  
  await Promise.all([
    saveTableToExcel('useradm', worksheet1, registrationDate),
    saveTableToExcel('userinhelp', worksheet2, registrationDate),
    saveTableToExcel('outhelp', worksheet3, registrationDate),
    saveTableToExcel('userevac', worksheet4, registrationDate),
    saveTableToExcel('userinhelp2', worksheet5, registrationDate)
  ]);

  const now = new Date();
  const momentDate = moment(now);
  const fileName = registrationDate ? `fail_${registrationDate}.xlsx` : `fail_${momentDate.format('DD.MM.YYYY')}.xlsx`;
  const filePath = `/opt/Telegrambot/Out/${fileName}`;

  workbook.xlsx.writeFile(filePath)
    .then(() => {
      console.log('Файл успешно сохранен в папке /opt/Telegrambot/Out');
      // Копируем файл во вторую папку
    const destPath1 = `/mnt/gdisc/.shared/Чат-бот/${fileName}`;
    fs.copyFile(filePath, destPath1, (err) => {
      if (err) {
        console.error('Ошибка при копировании файла:', err);
      } else {
        console.log(`Файл успешно скопирован в папку ${destPath1}`);
      }
    });
    // Копируем файл в третью папку
    const destPath2 = `/mnt/gdisc/.shared/Щоденні Файли з Бота/${fileName}`;
    fs.copyFile(filePath, destPath2, (err) => {
      if (err) {
        console.error('Ошибка при копировании файла:', err);
      } else {
        console.log(`Файл успешно скопирован в папку ${destPath2}`);
      }
    });
  })
  .catch((err) => console.error('Ошибка при сохранении файла:', err));
}

main();
