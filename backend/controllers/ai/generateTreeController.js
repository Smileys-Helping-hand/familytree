const { OpenAI } = require('openai');
const db = require('../../models');

const FREE_PLAN_LIMIT = 15;

/**
 * POST /api/ai/generate-tree
 * Body: { prompt: string, familyId: string }
 * Returns: Array of created member records
 */
exports.generateTree = async (req, res) => {
  // Guard: require OpenAI key before doing anything — avoids crash at module load time
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'AI generation is currently unavailable. The service is not configured on this server.',
      code: 'AI_NOT_CONFIGURED'
    });
  }

  // Lazy-init OpenAI so it never throws at require() time
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const { prompt, familyId } = req.body;
  if (!prompt || !familyId) {
    return res.status(400).json({ error: 'Missing prompt or familyId' });
  }

  // Check free plan limit before generation
  const userSubscription = req.user?.subscription || 'free';
  if (userSubscription === 'free') {
    const existingCount = await db.FamilyMember.count({ where: { familyId } });
    if (existingCount >= FREE_PLAN_LIMIT) {
      return res.status(403).json({
        error: `Free plan is limited to ${FREE_PLAN_LIMIT} family members. Upgrade to Premium for unlimited members.`,
        limitReached: true,
        limit: FREE_PLAN_LIMIT,
        current: existingCount
      });
    }
  }

  // System prompt — ask for a JSON object with a "members" array so json_object mode works correctly
  const systemPrompt = `You are a family tree extraction AI. Given a description of a family, extract all members and their relationships.

Return ONLY a JSON object in this exact format (no extra text, no markdown):
{
  "members": [
    {
      "tempId": "unique_string",
      "name": "Full Name",
      "gender": "male or female or other",
      "isLiving": true,
      "relationships": {
        "spouse": ["tempId_of_spouse"],
        "children": ["tempId_of_child"],
        "parents": ["tempId_of_parent"],
        "siblings": ["tempId_of_sibling"]
      }
    }
  ]
}

Rules:
- Every person mentioned must have a unique tempId (e.g., "john_1", "mary_2").
- Infer gender from names and pronouns where possible; default to "other" if unclear.
- isLiving defaults to true unless the text implies the person has passed away.
- Relationships must be reciprocal (if A is parent of B, B must list A as parent).
- Only include people explicitly or clearly implied in the text.`;

  try {
    // Call OpenAI — response_format json_object requires asking for an object, not an array
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    // Parse the JSON response — GPT returns an object, extract the members array
    let members;
    try {
      const parsed = JSON.parse(completion.choices[0].message.content);
      if (Array.isArray(parsed)) {
        members = parsed;
      } else if (Array.isArray(parsed.members)) {
        members = parsed.members;
      } else {
        // Try to find the first array value in the object
        const firstArray = Object.values(parsed).find(v => Array.isArray(v));
        if (firstArray) {
          members = firstArray;
        } else {
          throw new Error('No members array found in AI response');
        }
      }
    } catch (err) {
      return res.status(500).json({ error: 'Failed to parse AI output', details: err.message });
    }

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'No family members could be extracted from your prompt. Try adding more detail about the people in your family.' });
    }

    // Enforce free plan cap on total members after adding
    if (userSubscription === 'free') {
      const existingCount = await db.FamilyMember.count({ where: { familyId } });
      const remaining = FREE_PLAN_LIMIT - existingCount;
      if (remaining <= 0) {
        return res.status(403).json({
          error: `Free plan limit of ${FREE_PLAN_LIMIT} members reached. Upgrade to Premium for unlimited members.`,
          limitReached: true
        });
      }
      if (members.length > remaining) {
        members = members.slice(0, remaining);
      }
    }

    // Map tempIds to DB ids and create members
    const tempIdToDbId = {};
    const createdPairs = [];

    for (const member of members) {
      // Split name into firstName and lastName
      let firstName = member.name || 'Unknown';
      let lastName = '';
      if (member.name && member.name.includes(' ')) {
        const parts = member.name.split(' ');
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }

      const dbMember = await db.FamilyMember.create({
        firstName,
        lastName,
        gender: member.gender || 'other',
        isLiving: member.isLiving !== undefined ? member.isLiving : true,
        familyId,
        relationships: JSON.stringify({ parents: [], children: [], spouse: [], siblings: [] })
      });

      tempIdToDbId[member.tempId] = String(dbMember.id);
      createdPairs.push({ dbMember, memberData: member });
    }

    // Update relationships using resolved DB ids
    for (const { dbMember, memberData } of createdPairs) {
      const rels = memberData.relationships || {};
      const relationships = {
        spouse: (rels.spouse || []).map(tid => tempIdToDbId[tid]).filter(Boolean),
        children: (rels.children || []).map(tid => tempIdToDbId[tid]).filter(Boolean),
        parents: (rels.parents || []).map(tid => tempIdToDbId[tid]).filter(Boolean),
        siblings: (rels.siblings || []).map(tid => tempIdToDbId[tid]).filter(Boolean)
      };
      await dbMember.update({ relationships: JSON.stringify(relationships) });
    }

    res.json({
      success: true,
      members: createdPairs.map(({ dbMember }) => dbMember),
      count: createdPairs.length
    });
  } catch (error) {
    console.error('AI generate tree error:', error);
    res.status(500).json({ error: error.message || 'AI generation failed' });
  }
};
