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
      console.log(`Created new input page: ` + document.title);
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
    console.log(`Created new quote page with tags:` + JSON.stringify(highlight.tags));
    return createdPage;
  } catch (error) {
    console.error("Error creating quote page:", error.message);
  }
}

async function processTags(highlightTags, quoteID) {
    try {
      const databaseId = process.env.TOPICS_DATABASE_ID;
      for (const tag of highlightTags) {
        // Check if the topic already exists in the Topics database
        const existingTopics = await notion.databases.query({
          database_id: databaseId,
          filter: {
            property: 'Name',
            title: {
              equals: tag.name,
            },
          },
        });
  
        let topic;
        
        if (existingTopics.results.length === 0) {
          // If the topic doesn't exist, create a new page in the Topics database
          topic = await notion.pages.create({
            parent: {
              database_id: databaseId,
            },
            properties: {
              Name: {
                title: [
                  {
                    text: {
                      content: tag.name,
                    },
                  },
                ],
              },
            },
          });
        } else {
          // If the topic exists, use the first result
          topic = existingTopics.results[0];
        }
        // Add the topic as a relation to the quote
        const page = await notion.pages.update({
          page_id: quoteID,
          properties: {
            Topics: {
              relation: [
                {
                  id: topic.id,
                },
              ],
            },
          },
          // Append the topic to the existing relation instead of replacing it
          // This is useful if there are multiple tags for the same quote
          // and we want to preserve the previous relations
          // If there are no previous relations, Notion will ignore this parameter
          // and simply create a new relation
         // Append the topic to the existing relation instead of replacing it
            relations: {
                Topics: {
                append: true,
            },
  },
        });
      }
    } catch (error) {
      console.error('Error processing tags:', error.message);
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
    for (const result of results) {  
        if(result.category !== "tweets") {
            const inputID = await createInput(result);
            const highlights = result.highlights;
            for (const highlight of highlights) {
              const quote = await createQuote(highlight, inputID);
              const highlightTags = highlight.tags;
              await processTags(highlightTags, quote.id);        
            }
        }
    }
  })
  .catch((error) => {
    console.error("Error fetching data:", error.message);
  });