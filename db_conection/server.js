const mysql = require('mysql');

// Параметри підключення до бази даних
const connection = mysql.createConnection({
    host: 'mysql-mykoladiachuk.alwaysdata.net',
    user: '358029',
    password: 'asertan12',
    database: 'mykoladiachuk_photo_requests'
});

// Підключення до бази даних
connection.connect((err) => {
    if (err) {
        console.error('Помилка підключення до бази даних: ' + err.stack);
        return;
    }
    console.log('Успішне підключення до бази даних');
});

// Метод для додавання запису до таблиці
function addRecord(url, email) {
    const sql = 'INSERT INTO Requests (url, email) VALUES (?, ?)';
    const values = [url, email];
    connection.query(sql, values, (err, result) => {
        if (err) throw err;
        console.log('Запис успішно додано');
    });
}

function updateRecordStatusAndResult(id, newStatus, newResult) {
    const sql = 'UPDATE Requests SET status = ?, result = ? WHERE id = ?';
    const values = [newStatus, newResult, id];
    connection.query(sql, values, (err, result) => {
        if (err) throw err;
        console.log('Запис успішно оновлено');
    });
}

// Метод для отримання всіх записів з таблиці
function getAllRecords(callback) {
    const sql = 'SELECT * FROM Requests';
    connection.query(sql, (err, rows) => {
        if (err) throw err;
        callback(rows);
    });
}

//addRecord('http://example.com', 'example@example.com');
updateRecordStatusAndResult(5,'done',1)
getAllRecords((rows) => {
    console.log('Усі записи:');
    console.log(rows);
});

function disconnect() {
    connection.end();
}

disconnect();
