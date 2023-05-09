// Import necessary libraries
require('dotenv').config();
const axios = require('axios');
const db = require('./database');
const { insertUpdate } = require('./database');

// Set API keys and endpoints
const apiKey = process.env.RWAPI_KEY;
const apiUrl = 'https://readwise.io/api/v2/export/'; 
const dallEapiKEY = process.env.dallEapiKEY;
const dallEUrl = 'https://api.openai.com/v1/images/generations';

// Initialize Notion client
const { Client } = require("@notionhq/client");
const { OpenAIApi } = require('openai');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Define functions
async function getLastUpdate() {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM Updates ORDER BY date DESC LIMIT 1`, (err, row) => {
        if (err) {
          reject(err);
        } else {
            const timestamp = new Date(row.date).toISOString();
            resolve(timestamp);
        }
      });
    });
  }
async function createInput(document, coverImageUrl) {
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
          "Cover URL": {
            url: coverImageUrl,
          },
          Type: {
            select: {
              name: document.category,
            }
          },
      };
      const createdPage = await notion.pages.create({
        parent: {
          type: "database_id",
          database_id: process.env.INPUT_DATABASE_ID,
        },
        cover: {
            type: "external",
            external: {
                url: coverImageUrl
            }
        },
        properties: newInput,
      });
    //   console.log(`Created new input page: ` + document.title);
      return createdPage.id;
    } catch (error) {
      console.error("Error creating input page:", error.message);
    }
  }
async function createQuote(highlight, inputID, coverImageUrl) {
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
          "Cover URL": {
            url: coverImageUrl,
          },
          "Created Readwise": {
            date: {
              start: highlight.highlighted_at,
            }
          },
          Source: {
            relation: [
              {
                id: inputID,
              }
            ]
          },
      };

    const createdPage = await notion.pages.create({
      parent: {
        type: "database_id",
        database_id: process.env.QUOTES_DATABASE_ID,
      },
      cover: {
        type: "external",
        external: {
            url: coverImageUrl
        }
      },
      properties: newQuote,
    });
    // console.log(`Created new quote page with tags:` + JSON.stringify(highlight.tags));
    return createdPage;
  } catch (error) {
    console.error("Error creating quote page:", error.message);
  }
}
async function processTags(highlightTags, quoteID) {
    try {
      const databaseId = process.env.TOPICS_DATABASE_ID;
      const topicRelations = [];
  
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
  
        // Add the topic relation to the array
        topicRelations.push({
          id: topic.id,
        });
      }
  
      // Update the quote page with all the topic relations
      await notion.pages.update({
        page_id: quoteID,
        properties: {
          Topics: {
            relation: topicRelations,
          },
        },
      });
    } catch (error) {
      console.error('Error processing tags:', error.message);
    }
  }
async function addConnection(inputID, author) {
try {
    const databaseId = process.env.CONNECTIONS_DATABASE_ID;

    // Check if the author already exists in the Connections database
    const existingConnections = await notion.databases.query({
    database_id: databaseId,
    filter: {
        property: 'Name',
        title: {
        equals: author,
        },
    },
    });

    let connection;

    if (existingConnections.results.length === 0) {
    // If the author doesn't exist, create a new page in the Connections database
    connection = await notion.pages.create({
        parent: {
        database_id: databaseId,
        },
        properties: {
        Name: {
            title: [
            {
                text: {
                content: author,
                },
            },
            ],
        },
        },
    });
    } else {
    // If the author exists, use the first result
    connection = existingConnections.results[0];
    }

    // Add the connection as a relation to the quote
    await notion.pages.update({
    page_id: inputID,
    properties: {
        "Linked Author": {
        relation: [
            {
            id: connection.id,
            },
        ],
        },
    },
    // Append the connection to the existing relation instead of replacing it
    // This is useful if there are multiple connections for the same quote
    // and we want to preserve the previous relations
    // If there are no previous relations, Notion will ignore this parameter
    // and simply create a new relation
    relations: {
        "Linked Author": {
        append: true,
        },
    },
    });
} catch (error) {
    console.error('Error adding connection:', error.message);
}
}
async function generateImage(prompt, size = "1024x1024", n = 1, responseFormat = "url") {
    try {
      const { data } = await axios.post(dallEUrl, {
        prompt,
        size,
        n,
        response_format: responseFormat,
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.DALLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(`Generated ${n} image(s) for prompt: ${prompt}`);
      return data.data[0].url;
    } catch (error) {
      console.error("Error generating image:", error.message);
    }
  }  


// Fetch data from Readwise API
axios
  .get(apiUrl, {
    headers: {
      Authorization: `Token ${apiKey}`
    },
    params: {
      // updatedAfter: '2023-05-02T16:41:53.186Z'
    },
  })
  .then(async (response) => {
    const lastUpdate = await getLastUpdate();

    const start = new Date("5/8/2023, 10:04 PM")
    console.log("Start: " + start);

    const results = response.data.results;
    for (const result of results) { 
        let shouldCreateInput = false;
        for (const highlight of result.highlights) {
          // console.log(new Date(highlight.created_at) > start)
          if (new Date(highlight.created_at) > start) {
            shouldCreateInput = true;
            break;
          }
        }
        if (shouldCreateInput) {
          const url = await generateImage("An impressionist painting of " + result.title);
          const inputID = await createInput(result, url);
          await processTags(result.book_tags, inputID);
          await addConnection(inputID, result.author);
          const highlights = result.highlights;
          for (const highlight of highlights) {
            const highlightedAt = new Date(highlight.created_at);
            if (highlightedAt > start) {
              const url = await generateImage("An impressionist painting of " + result.title);
              const quote = await createQuote(highlight, inputID, url);
              const highlightTags = highlight.tags;
              await processTags(highlightTags, quote.id);
            }
          }
        }
    }
  })
  .catch((error) => {
    console.error("Error fetching data:", error.message);
  });
