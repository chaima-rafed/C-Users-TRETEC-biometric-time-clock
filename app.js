//connextion with database (mysql)
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();

// Configure bodyParser for JSON requests
app.use(bodyParser.json());

// Create a MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  port:'3306',
  database: 'biometric_time_clock',
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database');
});
//1. Create an endpoint to create a new employee
app.post('/employees', (req, res) => {
    const { lastName, firstName, department } = req.body;
    const dateCreated = new Date();
    const sql = 'INSERT INTO employees (lastName, firstName, dateCreated, department) VALUES (?, ?, ?, ?)';
    const values = [lastName, firstName, dateCreated, department];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Error creating an employee' });
      } else {
        res.status(201).json({ id: result.insertId, lastName, firstName, dateCreated, department });
      }
    });
  });
  //2. Add an endpoint to:
  app.get('/employees', (req, res) => {
    const { date } = req.query;
    let sql = 'SELECT * FROM employees';
    const values = [];
  
    if (date) {
      sql += ' WHERE dateCreated = ?';
      values.push(date);
    }
  
    db.query(sql, values, (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Error getting employees' });
      } else {
        res.json(results);
      }
    });
  });
  //3. Check-in / Check-out:
  app.post('/check-in', (req, res) => {
    const { employeeId, comment } = req.body;
    const checkInTime = new Date();
    
    // Insert check-in data into the 'checkin' table (modify the table name as per your schema).
    const sql = 'INSERT INTO checkin (employeeId, checkinTime, comment) VALUES (?, ?, ?)';
    const values = [employeeId, checkInTime, comment];
    
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error inserting check-in data: ' + err);
        res.status(500).json({ error: 'Error recording check-in' });
      } else {
        res.status(200).json({ message: 'Check-in recorded successfully', checkInTime, comment });
      }
    });
  });
  app.post('/check-out', (req, res) => {
    const { employeeId, comment } = req.body;
    const checkOutTime = new Date();
    
    // Insert check-out data into the 'checkout' table (modify the table name as per your schema).
    const sql = 'INSERT INTO checkout (employeeId, checkoutTime, comment) VALUES (?, ?, ?)';
    const values = [employeeId, checkOutTime, comment];
    
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error inserting check-out data: ' + err);
        res.status(500).json({ error: 'Error recording check-out' });
      } else {
        res.status(200).json({ message: 'Check-out recorded successfully', checkOutTime, comment });
      }
    });
  });
  //4. Time between check-in and check-out
  app.post('/check-out', (req, res) => {
    const { employeeId, comment } = req.body;
    const checkOutTime = new Date();
  
    // Find the corresponding check-in record for the employee
    const findCheckinSql = 'SELECT checkinTime FROM checkin WHERE employeeId = ? ORDER BY checkinTime DESC LIMIT 1';
  
    db.query(findCheckinSql, [employeeId], (err, results) => {
      if (err) {
        console.error('Error finding check-in record: ' + err);
        res.status(500).json({ error: 'Error finding check-in record' });
      } else {
        if (results.length === 0) {
          res.status(400).json({ error: 'No corresponding check-in record found' });
        } else {
          const checkInTime = results[0].checkinTime;
          const timeDifference = checkOutTime - checkInTime;
  
          // Calculate the duration in seconds and convert it to minutes
          const durationInMinutes = Math.floor(timeDifference / 1000 / 60);
  
          // Insert check-out data into the 'checkout' table and include the duration
          const insertCheckoutSql = 'INSERT INTO checkout (employeeId, checkoutTime, comment, duration) VALUES (?, ?, ?, ?)';
          const values = [employeeId, checkOutTime, comment, durationInMinutes];
  
          db.query(insertCheckoutSql, values, (err, result) => {
            if (err) {
              console.error('Error inserting check-out data: ' + err);
              res.status(500).json({ error: 'Error recording check-out' });
            } else {
              res.status(200).json({ message: 'Check-out recorded successfully', checkOutTime, comment });
            }
          });
        }
      }
    });
  });
  
  
  
  