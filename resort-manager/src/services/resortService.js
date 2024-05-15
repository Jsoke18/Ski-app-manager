import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export const fetchResorts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/resorts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching resorts:', error);
    throw error;
  }
};

export const addResort = async (newResort) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/resorts/ingest`, {
        name: newResort.name,
        // Include other properties if required
      });
      return response.data;
    } catch (error) {
      console.error('Error adding resort:', error);
      throw error;
    }
  };

export const updateResort = async (updatedResort) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/resorts/${updatedResort._id}`, updatedResort);
      return response.data;
    } catch (error) {
      console.error('Error updating resort:', error);
      throw error;
    }
  };