const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route to handle root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/submit', async (req, res) => {
  const salesforceUrl = 'https://wtv.lightning.force.com/lightning/o/Timesheet__c/';
  const bearerToken = process.env.SALESFORCE_BEARER_TOKEN;

  const data = {
    Start_Date__c: req.body.Start_Date__c,
    End_Date__c: req.body.End_Date__c,
    Users__c: req.body.Users__c,
    Hours_Spent__c: req.body.Hours_Spent__c,
    Work_Type__c: req.body.Work_Type__c,
    Work_Description__c: req.body.Work_Description__c,
    Proposal__c: req.body.Proposal__c,
    Account__c: req.body.Account__c,
  };

  try {
    const response = await fetch(salesforceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Salesforce Error:', errorData);
      return res.status(response.status).json(errorData);
    }

    const responseData = await response.json();
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack Trace:', error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
