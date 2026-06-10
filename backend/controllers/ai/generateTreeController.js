const { OpenAI } = require('openai');
const db = require('../../models');
const { recordActivity } = require('../../utils/activity');

const FREE_PLAN_LIMIT = 15;

const stripCodeFences = (text) => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
};

const getAiProvider = () => {
  const provider = String(process.env.AI_PROVIDER || '').toLowerCase();
  if (provider === 'gemini') return 'gemini';
  if (provider === 'openai') return 'openai';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return null;
};

const generateWithOpenAI = async (prompt, systemPrompt) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });

  return completion.choices[0].message.content;
};

const generateWithGemini = async (prompt, systemPrompt) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${details}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  return text;
};

/**
 * POST /api/ai/generate-tree
 * Body: { prompt: string, familyId: string }
 * Returns: Array of created member records
 */
exports.generateTree = async (req, res) => {
  const provider = getAiProvider();

  // Guard: require at least one configured AI provider before doing anything.
  if (!provider) {
    return res.status(503).json({
      error: 'AI generation is currently unavailable. Set OPENAI_API_KEY or GEMINI_API_KEY on this server.',
      code: 'AI_NOT_CONFIGURED'
    });
  }

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

  const systemPrompt = `You are a family tree genealogist. Parse family descriptions into a JSON object with members.
Each member must have: tempId, name, gender, birthDate, isLiving, relationships.

Output format:
{
  "members": [
    {
      "tempId": "john_1",
      "name": "John Smith",
      "gender": "male",
      "birthDate": "1960-01-01",
      "isLiving": true,
      "relationships": {
        "spouse": ["tempId_of_spouse"],
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
    const completionText = provider === 'gemini'
      ? await generateWithGemini(prompt, systemPrompt)
      : await generateWithOpenAI(prompt, systemPrompt);

    // Parse the JSON response and extract the members array.
    const parsed = JSON.parse(stripCodeFences(completionText));
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

    // Update family stats
    const family = await db.Family.findByPk(familyId);
    if (family) {
      const stats = family.stats || {};
      await family.update({
        stats: {
          ...stats,
          totalMembers: (stats.totalMembers || 0) + createdPairs.length
        }
      });
    }

    // Record activity
    await recordActivity({
      familyId,
      userId: req.user.id,
      type: 'ai_generated',
      action: 'generated a family tree with AI',
      description: `Generated ${createdPairs.length} family member${createdPairs.length !== 1 ? 's' : ''} using AI`,
      metadata: { count: createdPairs.length }
    });

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
