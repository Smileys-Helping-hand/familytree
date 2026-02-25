const { OpenAI } = require('openai');
const db = require('../models');

// Load your OpenAI API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/ai/generate-tree
 * Body: { prompt: string, familyId: string }
 * Returns: Array of created member records
 */
exports.generateTree = async (req, res) => {
  const { prompt, familyId } = req.body;
  if (!prompt || !familyId) {
    return res.status(400).json({ error: 'Missing prompt or familyId' });
  }

  // System prompt for LLM
  const systemPrompt = `You are a family tree extraction AI. Given a paragraph describing a family, extract all members and their relationships as a strict JSON array.\n\nReturn ONLY a JSON array, no extra text.\n\nEach member object must have:\n- tempId: unique string\n- name: string\n- gender: "male" | "female" | "other"\n- isLiving: boolean\n- relationships: { spouse: [tempId], children: [tempId], parents: [tempId] }\n\nExample:\n[\n  {\n    "tempId": "arthur_1",\n    "name": "Arthur",\n    "gender": "male",\n    "isLiving": false,\n    "relationships": {\n      "spouse": ["martha_2"],\n      "children": ["john_3", "sarah_4"],\n      "parents": []\n    }\n  },\n  {\n    "tempId": "martha_2",\n    "name": "Martha",\n    "gender": "female",\n    "isLiving": false,\n    "relationships": {\n      "spouse": ["arthur_1"],\n      "children": ["john_3", "sarah_4"],\n      "parents": []\n    }\n  }\n]\n\nStrictly follow this schema. Do not include any explanation or markdown.`;

  try {
    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    // Parse the JSON array from the LLM
    let members;
    try {
      members = JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to parse LLM output', details: err.message });
    }

    // Map tempIds to DB ids and create members
    const tempIdToDbId = {};
    const createdMembers = [];

    for (const member of members) {
      // Split name into firstName and lastName if possible
      let firstName = member.name;
      let lastName = '';
      if (member.name.includes(' ')) {
        const parts = member.name.split(' ');
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }
      const dbMember = await db.FamilyMember.create({
        firstName,
        lastName,
        gender: member.gender,
        isLiving: member.isLiving,
        familyId,
        relationships: { parents: [], children: [], spouse: [] }
      });
      tempIdToDbId[member.tempId] = dbMember.id;
      createdMembers.push(dbMember);
    }

    // Now update relationships
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const dbMember = createdMembers[i];
      // Map relationships to DB ids
      const relationships = {
        spouse: member.relationships.spouse.map(tid => tempIdToDbId[tid]),
        children: member.relationships.children.map(tid => tempIdToDbId[tid]),
        parents: member.relationships.parents.map(tid => tempIdToDbId[tid])
      };
      await dbMember.update({ relationships });
    }

    res.json(createdMembers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
