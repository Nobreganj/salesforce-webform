const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

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
        console.log('OAuth Params:', params.toString());

        const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
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
        console.error('Error fetching access token:', error);
        throw error;
    }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/submit', async (req, res) => {
    try {
        const accessToken = await getAccessToken(); // Fetch the token

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

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error during request:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
