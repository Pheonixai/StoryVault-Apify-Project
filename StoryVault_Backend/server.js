const express = require('express');
const cors = require('cors');
const { ApifyClient } = require('apify-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const apifyClient = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

app.use(cors());
app.use(express.json());

app.post('/api/research', async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic parameter is required.' });
    }

    console.log(`[SERVER] Received query for: "${topic}"`);

    // Basic query payload for Apify search
    const input = {
      queries: topic,
      maxPagesPerQuery: 1,
    };

    console.log('[SERVER] Triggering Apify Actor...');

    // Using Google Search Scraper Actor on Apify
    const run = await apifyClient.actor('apify/google-search-scraper').call(input);

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    console.log(`[SERVER] Success! Retrieved ${items.length} raw results.`);

    // Map Apify results to match frontend format
    const searchResults = items[0]?.organicResults || [];

    const responsePayload = {
      topic: topic,
      summary: searchResults[0]?.description || `Historical archive scan complete for "${topic}".`,
      timeline: searchResults.slice(0, 5).map((item, index) => ({
        date: `Archival Record #${index + 1}`,
        event: item.title || 'Historical Document Entry',
        description: item.description || 'Details compiled from indexed regional records.',
        sourceUrl: item.url || '#'
      })),
      sources: searchResults.slice(0, 5).map(item => ({
        title: item.title || 'Audited Web Source',
        domain: item.displayedUrl || item.url || 'Public Domain Archive',
        url: item.url || '#'
      })),
      warnings: [
        'Data gathered via automated Apify Actor dataset run.',
        'Cross-reference primary sources before academic citation.'
      ]
    };

    res.status(200).json(responsePayload);

  } catch (error) {
    console.error('[SERVER ERROR]:', error.message);
    res.status(500).json({
      error: 'Backend execution error during Apify Actor run.',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 StoryVault Backend Server Live on Port ${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/research`);
  console.log(`==================================================\n`);
});