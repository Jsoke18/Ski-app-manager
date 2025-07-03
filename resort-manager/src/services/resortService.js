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
    console.log('geoJSONFile:', formData.get('geoJSONFile'));
    console.log('Form Data:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    const response = await axios.post(`${API_BASE_URL}/resorts/ingest`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Server response:', response.data); // Add this line
    return response.data;
  } catch (error) {
    console.error('Error adding resort:', error);
    throw error;
  }
};

export const updateResort = async (formData) => {
  try {
    console.log('geoJSONFile:', formData.get('geoJSONFile'));
    // Print the form data
    console.log('Form Data:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    const resortId = formData.get('_id');
    const response = await axios.put(`${API_BASE_URL}/resorts/${resortId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Update response status:', response.status);
    console.log('Update response data:', response.data);
    return response;
  } catch (error) {
    console.error('Error updating resort:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    throw error;
  }
};

export const deleteResort = async (resortId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/resorts/${resortId}`);
    if (response.status === 200 || response.status === 204) {
      // Successful deletion
      return response.data;
    } else {
      // Unsuccessful deletion
      throw new Error('Failed to delete resort');
    }
  } catch (error) {
    console.error('Error deleting resort:', error);
    throw error;
  }
};

// New flagging API endpoints
export const fetchFlaggedResorts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/resorts/flagged`);
    return response.data;
  } catch (error) {
    console.error('Error fetching flagged resorts:', error);
    throw error;
  }
};

export const getResortFlagStatus = async (resortId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/resorts/${resortId}/flag`);
    return response.data;
  } catch (error) {
    console.error('Error getting resort flag status:', error);
    throw error;
  }
};

export const setResortFlagStatus = async (resortId, flagged) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/resorts/${resortId}/flag`, {
      flagged: flagged
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error setting resort flag status:', error);
    throw error;
  }
};