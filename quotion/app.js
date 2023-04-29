// Load environment variables from .env file
require('dotenv').config();

const axios = require('axios');

const apiKey = process.env.API_KEY;
const apiUrl = 'https://readwise.io/api/v2/export/'; // Replace with the actual API URL

axios.get(apiUrl, {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error('Error fetching data:', error.message);
});