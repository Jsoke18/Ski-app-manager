import axios from 'axios';

const BASE_URL = 'http://localhost:3000'; // Update with your backend API URL

const scrapingService = {
  scrapeAndIngest: async (name, url) => {
    try {
      const response = await axios.post(`${BASE_URL}/resorts/scrape-and-ingest`, { name, url });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default scrapingService;