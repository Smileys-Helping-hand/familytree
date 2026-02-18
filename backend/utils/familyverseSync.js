// backend/utils/familyverseSync.js
const axios = require('axios');

const FAMILYVERSE_SYNC_URL = process.env.FAMILYVERSE_SYNC_URL || 'https://familyverse.app/api/sync-member'; // Set actual endpoint
const FAMILYVERSE_API_KEY = process.env.FAMILYVERSE_API_KEY || '';

async function syncMemberToFamilyVerse(member) {
  try {
    // You may want to filter/transform member data before sending
    const headers = {};
    if (FAMILYVERSE_API_KEY) headers['x-api-key'] = FAMILYVERSE_API_KEY;
    await axios.post(FAMILYVERSE_SYNC_URL, member, { headers });
    return true;
  } catch (err) {
    console.error('FamilyVerse sync failed:', err?.response?.data || err.message);
    return false;
  }
}

module.exports = { syncMemberToFamilyVerse };
