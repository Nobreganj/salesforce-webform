const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Function to get Salesforce Access Token
async function getAccessToken() {
    const params = new URLSearchParams({
        grant_type: 'password',
        client_id: process.env.client_id,
        client_secret: process.env.client_secret,
        username: process.env.username,
        password: process.env.password,
    });

    try {
        console.log('Requesting access token from Salesforce...');
        console.log('OAuth Params:', params.toString());  // Log the params (ensure sensitive info is hidden)

        const response = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Failed to get access token:', data.error_description);
            throw new Error(`Failed to get access token: ${data.error_description}`);
        }

        console.log('Access Token received:', data.access_token);
        return data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error.message);
        throw error;
    }
}
// Route to handle form submissions
app.post('/submit', async (req, res) => {
    const salesforceUrl = `${process.env.salesforceInstanceUrl}/services/data/v56.0/sobjects/Timesheet__c/`;

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

        console.log('Making API request to Salesforce...');
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

        console.log('API request successful:', responseData);
        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error during request:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
