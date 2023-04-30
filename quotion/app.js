require('dotenv').config();

const axios = require('axios');
const db = require('./database');

const apiKey = process.env.RWAPI_KEY;
const apiUrl = 'https://readwise.io/api/v2/export/'; 

const { Client } = require("@notionhq/client");

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function documentID(){
    try {

    } catch (error) {
        console.error("Error getting input ID:", error.message);
    }
}

async function createInput(document) {
    try {
      const newInput = {
  
        Name: {
            title: [
              {
                text: {
                  content: document.title,
                },
              },
            ],
          },
          URL: {
            url: document.source_url,
          },
          Type: {
            select: {
              name: document.category,
            }
          }
      };
  
      const createdPage = await notion.pages.create({
        parent: {
          type: "database_id",
          database_id: process.env.INPUT_DATABASE_ID,
        },
        properties: newInput,
      });
      console.log(`Created new input page: ${document.title}`);
      return createdPage.id;
    } catch (error) {
      console.error("Error creating input page:", error.message);
    }
  }

async function createQuote(highlight, inputID) {
  try {
    const newQuote = {
  
        Name: {
            title: [
              {
                text: {
                  content: highlight.text,
                },
              },
            ],
          },
          Source: {
            relation: [
              {
                id: inputID,
              }
            ]
          }
      };

    const createdPage = await notion.pages.create({
      parent: {
        type: "database_id",
        database_id: process.env.QUOTES_DATABASE_ID,
      },
      properties: newQuote,
    });
    // console.log(`Created new quote page: ${highlight.text}`);
    console.log(`Created new quote page `+ inputID);
    return createdPage;
  } catch (error) {
    console.error("Error creating quote page:", error.message);
  }
}

axios
  .get(apiUrl, {
    headers: {
      Authorization: `Token ${apiKey}`,
    },
  })
  .then(async (response) => {
    const results = response.data.results;
    console.log(results.length)
    for (const result of results) {
      const inputID = await createInput(result);
      const highlights = result.highlights;
      for (const highlight of highlights) {
       await createQuote(highlight, inputID);
      }
    }
  })
  .catch((error) => {
    console.error("Error fetching data:", error.message);
  });