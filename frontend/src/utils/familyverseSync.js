// This utility posts new member data to the FamilyVerse sync endpoint after a member is created in FamilyTree.
import axios from 'axios';

// Set the FamilyVerse sync endpoint URL here
const FAMILYVERSE_SYNC_URL = 'https://familyverse.app/api/sync-member'; // TODO: Replace with actual endpoint

export async function syncMemberToFamilyVerse(memberData) {
  try {
    // You may want to filter/transform memberData before sending
    await axios.post(FAMILYVERSE_SYNC_URL, memberData);
    // Optionally handle response or logging
    return true;
  } catch (error) {
    // Optionally log error or show notification
    // console.error('FamilyVerse sync failed:', error);
    return false;
  }
}
