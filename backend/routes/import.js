const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { recordActivity } = require('../utils/activity');
const { Family, FamilyMember, User } = require('../models');

// Import contacts/members from external system (Familyverse, Nexus Hub, etc.)
router.post('/contacts', protect, async (req, res) => {
  try {
    const { familyId, contacts, source = 'external' } = req.body;

    if (!familyId || !contacts || !Array.isArray(contacts)) {
      return res.status(400).json({
        success: false,
        error: 'familyId and contacts array are required'
      });
    }

    // Verify family ownership/access
    const family = await Family.findByPk(familyId);
    if (!family || family.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this family'
      });
    }

    const results = {
      imported: [],
      duplicates: [],
      errors: []
    };

    // Process each contact
    for (const contact of contacts) {
      try {
        // Validate required fields
        if (!contact.firstName || !contact.lastName) {
          results.errors.push({
            contact: contact.name,
            error: 'First name and last name are required'
          });
          continue;
        }

        // Check for duplicate by name and birth date
        const existing = await FamilyMember.findOne({
          where: {
            familyId,
            firstName: contact.firstName,
            lastName: contact.lastName,
            ...(contact.birthDate && { birthDate: contact.birthDate })
          }
        });

        if (existing) {
          results.duplicates.push({
            name: `${contact.firstName} ${contact.lastName}`,
            externalId: contact.id,
            reason: 'Member with same name and birthdate exists'
          });
          continue;
        }

        // Create new family member
        const member = await FamilyMember.create({
          familyId,
          firstName: contact.firstName,
          lastName: contact.lastName,
          gender: contact.gender || 'not_specified',
          birthDate: contact.birthDate || null,
          deathDate: contact.deathDate || null,
          bio: contact.bio || contact.notes || null,
          occupation: contact.occupation || null,
          location: contact.location || null,
          photo: contact.photo || null,
          externalId: contact.id,
          externalSource: source,
          createdBy: req.user.id
        });

        results.imported.push({
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          externalId: contact.id
        });
      } catch (error) {
        results.errors.push({
          contact: `${contact.firstName} ${contact.lastName}`,
          error: error.message
        });
      }
    }

    // Record activity
    await recordActivity({
      familyId,
      userId: req.user.id,
      type: 'import',
      description: `Imported ${results.imported.length} contacts from ${source}`
    });

    res.json({
      success: true,
      data: results,
      summary: {
        total: contacts.length,
        imported: results.imported.length,
        duplicates: results.duplicates.length,
        errors: results.errors.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Sync with external system (Familyverse, Nexus Hub)
router.post('/sync/:familyId', protect, async (req, res) => {
  try {
    const { familyId } = req.params;
    const { externalSystemUrl, apiKey } = req.body;

    if (!externalSystemUrl || !apiKey) {
      return res.status(400).json({
        success: false,
        error: 'externalSystemUrl and apiKey are required'
      });
    }

    // Verify family ownership
    const family = await Family.findByPk(familyId);
    if (!family || family.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this family'
      });
    }

    // TODO: Implement actual sync with external system
    // This would call the externalSystemUrl with the apiKey
    // and fetch updated contact/member data

    const syncResult = {
      status: 'pending',
      familyId,
      externalSystem: externalSystemUrl,
      startedAt: new Date().toISOString(),
      message: 'Sync will be processed in the background'
    };

    // Update family sync status
    await family.update({
      syncStatus: 'syncing',
      lastSyncAt: new Date()
    });

    // Record activity
    await recordActivity({
      familyId,
      userId: req.user.id,
      type: 'sync',
      description: 'Started sync with external system'
    });

    res.json({
      success: true,
      data: syncResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get import/sync status
router.get('/status/:familyId', protect, async (req, res) => {
  try {
    const { familyId } = req.params;

    const family = await Family.findByPk(familyId);
    if (!family) {
      return res.status(404).json({
        success: false,
        error: 'Family not found'
      });
    }

    // Check if user has access to this family
    const hasAccess = family.createdBy === req.user.id ||
      await family.hasMember(req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        familyId,
        syncStatus: family.syncStatus || 'never',
        lastSyncAt: family.lastSyncAt,
        lastSyncError: family.lastSyncError || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
