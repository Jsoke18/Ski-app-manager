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

export const addResort = async (formData) => {
  try {
    console.log('geoJSONFile:', formData.get('geoJSONFile')); // Print the form data
    console.log('Form Data:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const response = await axios.post(`${API_BASE_URL}/resorts/ingest`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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

  export const deleteResort = async (resortId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/resorts/${resortId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting resort:', error);
      throw error;
    }
  };