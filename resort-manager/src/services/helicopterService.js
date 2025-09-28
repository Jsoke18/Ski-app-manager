import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Get helicopter packages for a specific resort
export const fetchHelicopterPackages = async (resortId) => {
  try {
    console.log('🚁 Fetching helicopter packages for resort:', resortId);
    const response = await axios.get(`${API_BASE_URL}/resorts/${resortId}/heli-snowcat`);
    console.log('🚁 Helicopter API response:', response.data);
    // Fixed path: helicopters.heliSkiing.packages (not just heliSkiing.packages)
    const packages = response.data?.helicopters?.heliSkiing?.packages || [];
    console.log('🚁 Extracted packages:', packages);
    return packages;
  } catch (error) {
    console.error('❌ Error fetching helicopter packages:', error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    return [];
  }
};

// Get full heli-skiing data for a resort
export const fetchHeliSkiingData = async (resortId) => {
  try {
    console.log('🚁 Fetching full heli-skiing data for resort:', resortId);
    const response = await axios.get(`${API_BASE_URL}/resorts/${resortId}/heli-snowcat`);
    console.log('🚁 Full heli API response:', response.data);
    // Fixed path: helicopters.heliSkiing (not just heliSkiing)
    const heliData = response.data?.helicopters?.heliSkiing || null;
    console.log('🚁 Extracted heli data:', heliData);
    return heliData;
  } catch (error) {
    console.error('❌ Error fetching heli-skiing data:', error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    return null;
  }
};

// Get complete heli-snowcat data for a resort (includes both helicopters and snowcats)
export const fetchCompleteHeliSnowcatData = async (resortId) => {
  try {
    console.log('🚁🐱 Fetching complete heli-snowcat data for resort:', resortId);
    const response = await axios.get(`${API_BASE_URL}/resorts/${resortId}/heli-snowcat`);
    console.log('🚁🐱 Complete API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching complete heli-snowcat data:', error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    return null;
  }
};

const helicopterService = {
  fetchHelicopterPackages,
  fetchHeliSkiingData
};

export default helicopterService;