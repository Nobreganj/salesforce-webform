const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Salesforce OAuth2 Credentials
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const username = process.env.USERNAME;
const password = process.env.PASSWORD + process.env.SECURITY_TOKEN;
const tokenUrl = 'https://login.salesforce.com/services/oauth2/token';
const salesforceInstanceUrl = 'https://wtv.lightning.force.com';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Enable CORS for all routes

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route to serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to get Salesforce Access Token
async function getAccessToken() {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('username', username);
    params.append('password', password);

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error fetching access token:', data);
            throw new Error(`Failed to get access token: ${data.error_description}`);
        }

        console.log('Access token retrieved:', data.access_token);
        return data.access_token;
    } catch (error) {
        console.error('Error during access token retrieval:', error.message);
        throw error;
    }
}

// Route to handle form submissions
app.post('/submit', async (req, res) => {
    const salesforceUrl = `${salesforceInstanceUrl}/services/data/v56.0/sobjects/Timesheet__c/`;

    const data = {
        Start_Date__c: req.body.Start_Date__c,
        End_Date__c: req.body.End_Date__c,
        Users__c: req.body.Users__c,
        Hours_Spent__c: req.body.Hours_Spent__c,
        Work_Type__c: req.body.Work_Type__c,
        Work_Description__c: req.body.Work_Description__c,
        Proposal__c: req.body.Proposal__c,
        Account__c: req.body.Account__c
    };

    try {
        const accessToken = await getAccessToken();

        const response = await fetch(salesforceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('Salesforce API error:', responseData);
            return res.status(response.status).json(responseData);
        }

        console.log('Salesforce response:', responseData);
        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error during request:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
