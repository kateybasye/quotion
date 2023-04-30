require('dotenv').config();
const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const databaseId = process.env.NOTION_DATABASE_ID;

(async () => {
  try {
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });
    console.log(`Database name: ${database.title[0].text.content}`);
  } catch (error) {
    console.error(error);
  }
})();