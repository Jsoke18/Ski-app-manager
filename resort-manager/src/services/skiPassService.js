import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Get all ski passes
export const fetchSkiPasses = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ski-passes`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ski passes:', error);
    throw error;
  }
};

// Add new ski pass - using same pattern as resort ingest
export const addSkiPass = async (skiPassData, imageFile = null) => {
  try {
    let requestData;
    let headers;

    if (imageFile) {
      // Use FormData when there's an image - match resort pattern
      requestData = new FormData();
      
      // Append all ski pass data fields individually (not as JSON)
      requestData.append('name', skiPassData.name || '');
      requestData.append('description', skiPassData.description || '');
      requestData.append('website', skiPassData.website || '');
      requestData.append('season', skiPassData.season || '');
      requestData.append('passType', skiPassData.passType || '');
      requestData.append('isActive', skiPassData.isActive !== undefined ? skiPassData.isActive : true);
      requestData.append('logo', skiPassData.logo || '');
      requestData.append('color', skiPassData.color || '');
      
      // Append nested objects as JSON strings
      requestData.append('price', JSON.stringify(skiPassData.price || {}));
      requestData.append('restrictions', JSON.stringify(skiPassData.restrictions || {}));
      requestData.append('benefits', JSON.stringify(skiPassData.benefits || []));
      
      // Append image file
      requestData.append('imageFile', imageFile);

      headers = {
        'Content-Type': 'multipart/form-data',
      };
    } else {
      // Use JSON when there's no image
      requestData = skiPassData;
      headers = {
        'Content-Type': 'application/json',
      };
    }

    // Try both endpoints - if your backend has an ingest endpoint like resorts
    const response = await axios.post(`${API_BASE_URL}/api/ski-passes/ingest`, requestData, {
      headers,
    }).catch(async (error) => {
      // If ingest endpoint doesn't exist, try the regular endpoint
      if (error.response?.status === 404) {
        return await axios.post(`${API_BASE_URL}/api/ski-passes`, requestData, {
          headers,
        });
      }
      throw error;
    });

    return response.data;
  } catch (error) {
    console.error('Error adding ski pass:', error);
    throw error;
  }
};

// Update ski pass
export const updateSkiPass = async (skiPassId, skiPassData, imageFile = null) => {
  try {
    let requestData;
    let headers;

    if (imageFile) {
      // Use FormData when there's an image - match resort pattern
      requestData = new FormData();
      
      // Append all ski pass data fields individually (not as JSON)
      requestData.append('name', skiPassData.name || '');
      requestData.append('description', skiPassData.description || '');
      requestData.append('website', skiPassData.website || '');
      requestData.append('season', skiPassData.season || '');
      requestData.append('passType', skiPassData.passType || '');
      requestData.append('isActive', skiPassData.isActive !== undefined ? skiPassData.isActive : true);
      requestData.append('logo', skiPassData.logo || '');
      requestData.append('color', skiPassData.color || '');
      
      // Append nested objects as JSON strings
      requestData.append('price', JSON.stringify(skiPassData.price || {}));
      requestData.append('restrictions', JSON.stringify(skiPassData.restrictions || {}));
      requestData.append('benefits', JSON.stringify(skiPassData.benefits || []));
      
      // Append image file
      requestData.append('imageFile', imageFile);

      headers = {
        'Content-Type': 'multipart/form-data',
      };
    } else {
      // Use JSON when there's no image
      requestData = skiPassData;
      headers = {
        'Content-Type': 'application/json',
      };
    }

    const response = await axios.put(`${API_BASE_URL}/api/ski-passes/${skiPassId}`, requestData, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating ski pass:', error);
    throw error;
  }
};

// Delete ski pass
export const deleteSkiPass = async (skiPassId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/ski-passes/${skiPassId}`);
    if (response.status === 200 || response.status === 204) {
      return response.data;
    } else {
      throw new Error('Failed to delete ski pass');
    }
  } catch (error) {
    console.error('Error deleting ski pass:', error);
    throw error;
  }
};

// Assign ski pass to resort
export const assignSkiPassToResort = async (resortId, skiPassId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/resorts/${resortId}/ski-passes/${skiPassId}`);
    return response.data;
  } catch (error) {
    console.error('Error assigning ski pass to resort:', error);
    throw error;
  }
};

// Update resort with ski passes (using PUT request)
export const updateResortSkiPasses = async (resortId, skiPassIds) => {
  try {
    const formData = new FormData();
    formData.append('skiPasses', JSON.stringify(skiPassIds));
    
    const response = await axios.put(`${API_BASE_URL}/resorts/${resortId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating resort ski passes:', error);
    throw error;
  }
}; 