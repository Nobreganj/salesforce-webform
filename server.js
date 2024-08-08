const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/submit', async (req, res) => {
  const data = {
    Start_Date__c: req.body.start_date,
    End_Date__c: req.body.end_date,
    Users__c: req.body.user,
    Hours_Spent__c: req.body.hours_spent,
    Work_Type__c: req.body.work_type,
    Work_Description__c: req.body.work_description,
    Proposal__c: req.body.proposal,
    Account__c: req.body.account
  };

  console.log("Payload Data: ", data);

  try {
    const tokenResponse = await axios.post('https://login.salesforce.com/services/oauth2/token', null, {
      params: {
        grant_type: 'password',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        username: process.env.SALESFORCE_USERNAME,
        password: process.env.SALESFORCE_PASSWORD
      }
    });

    const accessToken = tokenResponse.data.access_token;
    const instanceUrl = tokenResponse.data.instance_url;

    console.log("Access Token: ", accessToken);
    console.log("Instance URL: ", instanceUrl);

    const response = await axios.post(`${instanceUrl}/services/data/v56.0/sobjects/Timesheet__c/`, data, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.send('Data submitted successfully: ' + JSON.stringify(response.data));
  } catch (error) {
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      res.send(`Error: ${error.response.status} - ${error.response.data}`);
    } else if (error.request) {
      console.error('Error request data:', error.request);
      res.send('Error: No response received from Salesforce');
    } else {
      console.error('Error message:', error.message);
      res.send(`Error: ${error.message}`);
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
