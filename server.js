const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from /public

const CSV_FILE = path.join(__dirname, 'queries.csv');

// Create CSV header if it doesn't exist
if (!fs.existsSync(CSV_FILE)) {
  fs.writeFileSync(CSV_FILE, 'Name,Email,Message\n');
}

// === POST /query – save to CSV + send email ===
app.post('/query', (req, res) => {
  const { name, email, message } = req.body;
  const cleanedMessage = message.replace(/\n/g, ' ').replace(/"/g, "'");
  const row = `"${name}","${email}","${cleanedMessage}"\n`;
  fs.appendFileSync(CSV_FILE, row);

  // Send email notification
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ramsamujhsingh70@gmail.com', // your Gmail
      pass: 'your_app_password_here'      // use your Gmail App Password
    }
  });

  const mailOptions = {
    from: 'ramsamujhsingh70@gmail.com',
    to: 'ramsamujhsingh70@gmail.com',
    subject: `📬 New Query from ${name}`,
    html: `
      <h3>New Query Submitted</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br/>${message}</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('❌ Email failed:', error);
    } else {
      console.log('✅ Email sent:', info.response);
    }
  });

  res.send('<h2>✅ Thanks for submitting your query!</h2><a href="/">⬅️ Back to site</a>');
});

// === GET /admin – View all queries ===
app.get('/admin', (req, res) => {
  const data = fs.readFileSync(CSV_FILE, 'utf8');
  const lines = data.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map(line => line.split(','));

  let html = `
    <html>
      <head>
        <title>Admin Dashboard</title>
        <style>
          body { font-family: sans-serif; background: #f4f4f4; padding: 20px; }
          h2 { color: #1a237e; }
          .export-btn {
            display: inline-block;
            background: #1a237e;
            color: #fff;
            padding: 10px 15px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 10px;
          }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; border: 1px solid #ccc; text-align: left; }
          th { background-color: #e3f2fd; color: #0d47a1; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h2>Admin Dashboard – Submitted Queries</h2>
        <a href="/download-csv" class="export-btn">⬇️ Export CSV</a>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  res.send(html);
});

// === GET /download-csv – Download CSV file ===
app.get('/download-csv', (req, res) => {
  res.download(CSV_FILE, 'queries.csv', (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Error downloading CSV');
    }
  });
});

// === Start the server ===
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
