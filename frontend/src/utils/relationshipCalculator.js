const normalizeRelationships = (relationships) => {
  if (!relationships) {
    return { parents: [], children: [], spouse: [], siblings: [] };
  }

  let parsed = relationships;
  if (typeof relationships === 'string') {
    try {
      parsed = JSON.parse(relationships);
    } catch (error) {
      parsed = {};
    }
  }

  return {
    parents: Array.isArray(parsed.parents) ? parsed.parents : [],
    children: Array.isArray(parsed.children) ? parsed.children : [],
    spouse: Array.isArray(parsed.spouse) ? parsed.spouse : [],
    siblings: Array.isArray(parsed.siblings) ? parsed.siblings : []
  };
};

const getGenderedLabel = (gender, maleLabel, femaleLabel, neutralLabel) => {
  if (gender === 'male') return maleLabel;
  if (gender === 'female') return femaleLabel;
  return neutralLabel;
};

const ordinal = (value) => {
  const num = Number(value);
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
  const mod10 = num % 10;
  if (mod10 === 1) return `${num}st`;
  if (mod10 === 2) return `${num}nd`;
  if (mod10 === 3) return `${num}rd`;
  return `${num}th`;
};

const ancestorLabel = (depth, gender, isAncestor) => {
  if (depth === 1) {
    return isAncestor
      ? getGenderedLabel(gender, 'Father', 'Mother', 'Parent')
      : getGenderedLabel(gender, 'Son', 'Daughter', 'Child');
  }
  if (depth === 2) {
    return isAncestor
      ? getGenderedLabel(gender, 'Grandfather', 'Grandmother', 'Grandparent')
      : getGenderedLabel(gender, 'Grandson', 'Granddaughter', 'Grandchild');
  }

  const greatCount = depth - 2;
  const prefix = 'Great-'.repeat(greatCount);
  return isAncestor
    ? `${prefix}${getGenderedLabel(gender, 'Grandfather', 'Grandmother', 'Grandparent')}`
    : `${prefix}${getGenderedLabel(gender, 'Grandson', 'Granddaughter', 'Grandchild')}`;
};

const auntUncleLabel = (depthFromAncestor, gender) => {
  if (depthFromAncestor <= 1) {
    return getGenderedLabel(gender, 'Uncle', 'Aunt', 'Aunt/Uncle');
  }

  const prefix = 'Great-'.repeat(depthFromAncestor - 1);
  return `${prefix}${getGenderedLabel(gender, 'Uncle', 'Aunt', 'Aunt/Uncle')}`;
};

const nieceNephewLabel = (depthFromAncestor, gender) => {
  if (depthFromAncestor <= 1) {
    return getGenderedLabel(gender, 'Nephew', 'Niece', 'Niece/Nephew');
  }

  const prefix = 'Great-'.repeat(depthFromAncestor - 1);
  return `${prefix}${getGenderedLabel(gender, 'Nephew', 'Niece', 'Niece/Nephew')}`;
};

const cousinLabel = (degree, removal) => {
  const base = `${ordinal(degree)} cousin`;
  if (removal === 0) return base;
  if (removal === 1) return `${base} once removed`;
  if (removal === 2) return `${base} twice removed`;
  return `${base} ${removal} times removed`;
};

const getAncestorMap = (memberId, memberIndex, maxDepth = 12) => {
  const depths = new Map();
  const queue = [{ id: memberId, depth: 0 }];
  depths.set(memberId, 0);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.depth >= maxDepth) continue;

    const member = memberIndex.get(current.id);
    const parents = member?.relationships?.parents || [];
    parents.forEach((parentId) => {
      const nextDepth = current.depth + 1;
      if (!depths.has(parentId) || nextDepth < depths.get(parentId)) {
        depths.set(parentId, nextDepth);
        queue.push({ id: parentId, depth: nextDepth });
      }
    });
  }

  return depths;
};

export const buildMemberIndex = (members, getId = (member) => String(member?.id || member?._id || '')) => {
  const index = new Map();
  members.forEach((member) => {
    const id = getId(member);
    if (!id) return;
    index.set(id, {
      ...member,
      relationships: normalizeRelationships(member.relationships)
    });
  });
  return index;
};

export const computeRelationshipLabel = (memberId, targetId, memberIndex) => {
  if (!memberId || !targetId) return { label: 'Unknown', kind: 'unknown' };
  if (memberId === targetId) return { label: 'Self', kind: 'self' };

  const member = memberIndex.get(memberId);
  const target = memberIndex.get(targetId);
  if (!member || !target) return { label: 'Unknown', kind: 'unknown' };

  const memberRel = member.relationships || {};

  if (memberRel.spouse?.includes(targetId)) {
    return { label: 'Spouse', kind: 'spouse' };
  }
  if (memberRel.children?.includes(targetId)) {
    return { label: ancestorLabel(1, member.gender, true), kind: 'parent' };
  }
  if (memberRel.parents?.includes(targetId)) {
    return { label: ancestorLabel(1, member.gender, false), kind: 'child' };
  }
  if (memberRel.siblings?.includes(targetId)) {
    return { label: 'Sibling', kind: 'sibling' };
  }

  const ancestorsA = getAncestorMap(memberId, memberIndex);
  const ancestorsB = getAncestorMap(targetId, memberIndex);

  let best = null;
  ancestorsA.forEach((depthA, ancestorId) => {
    if (!ancestorsB.has(ancestorId)) return;
    const depthB = ancestorsB.get(ancestorId);
    const total = depthA + depthB;
    const maxDepth = Math.max(depthA, depthB);

    if (!best || total < best.total || (total === best.total && maxDepth < best.maxDepth)) {
      best = { ancestorId, depthA, depthB, total, maxDepth };
    }
  });

  if (!best) {
    return { label: 'No known relation', kind: 'unknown' };
  }

  if (best.depthA === 0) {
    return { label: ancestorLabel(best.depthB, member.gender, true), kind: 'ancestor' };
  }
  if (best.depthB === 0) {
    return { label: ancestorLabel(best.depthA, member.gender, false), kind: 'descendant' };
  }

  if (best.depthA === 1 && best.depthB === 1) {
    return { label: 'Sibling', kind: 'sibling' };
  }

  if (best.depthA === 1 && best.depthB > 1) {
    return { label: auntUncleLabel(best.depthB - 1, member.gender), kind: 'aunt-uncle' };
  }

  if (best.depthB === 1 && best.depthA > 1) {
    return { label: nieceNephewLabel(best.depthA - 1, member.gender), kind: 'niece-nephew' };
  }

  const degree = Math.max(1, Math.min(best.depthA, best.depthB) - 1);
  const removal = Math.abs(best.depthA - best.depthB);
  return { label: cousinLabel(degree, removal), kind: 'cousin' };
};
