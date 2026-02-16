import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memberAPI, familyAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, { Background, Controls, MiniMap, MarkerType, addEdge, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, X, Users, UserPlus, Search, Link2, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';
import FamilyNode from '../components/FamilyNode';
import AddMemberModal from '../components/AddMemberModal';
import { getLayoutedElements, layoutNodesInGrid } from '../utils/treeLayout';
import { buildMemberIndex, computeRelationshipLabel } from '../utils/relationshipCalculator';

export default function FamilyTree() {
  const { familyId: familyIdParam } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFamilyId, setSelectedFamilyId] = useState(familyIdParam);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'viewer' });
  const [inviteToken, setInviteToken] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [relationshipMode, setRelationshipMode] = useState('add');
  const [relationshipForm, setRelationshipForm] = useState({
    memberId: '',
    targetId: '',
    type: 'parent'
  });
  const [relationshipStatus, setRelationshipStatus] = useState(null);
  const [optimisticLinks, setOptimisticLinks] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [autoLayout, setAutoLayout] = useState(true);

  const getMemberId = (member) => String(member?.id || member?._id || '');

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

  const normalizeTreePosition = (position) => {
    if (!position) return null;
    if (typeof position === 'string') {
      try {
        return JSON.parse(position);
      } catch (error) {
        return null;
      }
    }
    return position;
  };

  const addUniqueValue = (list, value) => {
    if (!list.includes(value)) list.push(value);
  };

  const buildPayloadFromUiType = (memberId, targetId, uiType) => {
    if (uiType === 'parent') {
      return { memberId, targetId, type: 'child' };
    }
    if (uiType === 'child') {
      return { memberId, targetId, type: 'parent' };
    }
    return { memberId, targetId, type: uiType };
  };

  const pushUndoAction = (action) => {
    setUndoStack((prev) => [action, ...prev].slice(0, 10));
  };

  const buildOptimisticRelationships = (links) => {
    const relMap = new Map();

    const getRel = (memberId) => {
      if (!relMap.has(memberId)) {
        relMap.set(memberId, { parents: [], children: [], spouse: [], siblings: [] });
      }
      return relMap.get(memberId);
    };

    links.forEach((link) => {
      const { memberId, targetId, uiType } = link;
      if (!memberId || !targetId) return;

      if (uiType === 'parent') {
        addUniqueValue(getRel(memberId).children, targetId);
        addUniqueValue(getRel(targetId).parents, memberId);
      } else if (uiType === 'child') {
        addUniqueValue(getRel(memberId).parents, targetId);
        addUniqueValue(getRel(targetId).children, memberId);
      } else if (uiType === 'spouse') {
        addUniqueValue(getRel(memberId).spouse, targetId);
        addUniqueValue(getRel(targetId).spouse, memberId);
      } else if (uiType === 'sibling') {
        addUniqueValue(getRel(memberId).siblings, targetId);
        addUniqueValue(getRel(targetId).siblings, memberId);
      }
    });

    return relMap;
  };

  const areNodesDifferent = (prevNodes, nextNodes) => {
    if (prevNodes.length !== nextNodes.length) return true;
    const prevMap = new Map(prevNodes.map(node => [node.id, node.position]));
    return nextNodes.some(node => {
      const prevPos = prevMap.get(node.id);
      return !prevPos || prevPos.x !== node.position.x || prevPos.y !== node.position.y;
    });
  };

  const areEdgesDifferent = (prevEdges, nextEdges) => {
    if (prevEdges.length !== nextEdges.length) return true;
    const prevMap = new Map(prevEdges.map(edge => [edge.id, `${edge.source}-${edge.target}`]));
    return nextEdges.some(edge => prevMap.get(edge.id) !== `${edge.source}-${edge.target}`);
  };

  const { data: familiesData } = useQuery({
    queryKey: ['families'],
    queryFn: () => familyAPI.getAll(),
    enabled: !familyIdParam,
  });

  const families = familiesData?.data?.families || [];

  useEffect(() => {
    if (!familyIdParam && families.length > 0 && !selectedFamilyId) {
      setSelectedFamilyId(families[0].id);
    }
  }, [families, familyIdParam, selectedFamilyId]);

  const familyId = familyIdParam || selectedFamilyId;

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['family-members', familyId],
    queryFn: () => memberAPI.getAll(familyId),
    enabled: !!familyId,
  });

  const members = membersData?.data?.members || [];

  useEffect(() => {
    if (members.length > 1 && !relationshipForm.memberId && !relationshipForm.targetId) {
      setRelationshipForm(prev => ({
        ...prev,
        memberId: getMemberId(members[0]),
        targetId: getMemberId(members[1])
      }));
    }
  }, [members, relationshipForm.memberId, relationshipForm.targetId]);

  const normalizedMembers = useMemo(() => members.map((member) => ({
    ...member,
    relationships: normalizeRelationships(member.relationships),
    treePosition: normalizeTreePosition(member.treePosition)
  })), [members]);

  const memberIndex = useMemo(() => buildMemberIndex(normalizedMembers, getMemberId), [normalizedMembers]);

  const computedRelationship = useMemo(() => {
    if (!relationshipForm.memberId || !relationshipForm.targetId) return null;
    return computeRelationshipLabel(relationshipForm.memberId, relationshipForm.targetId, memberIndex);
  }, [relationshipForm.memberId, relationshipForm.targetId, memberIndex]);

  const filteredMembers = normalizedMembers.filter((member) => {
    const memberId = getMemberId(member);
    if (!memberId) return false;
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());
    const matchesGender = filterGender === 'all' || member.gender === filterGender;
    return matchesSearch && matchesGender;
  });

  const nodes = useMemo(() => filteredMembers.map((member) => {
    const memberId = getMemberId(member);
    return {
      id: memberId,
      type: 'familyNode',
      data: {
        member,
        onClick: () => navigate(`/member/${memberId}`),
        onEdit: () => setSelectedMember(member),
      },
      position: { x: 0, y: 0 },
    };
  }), [filteredMembers, navigate]);

  const edges = useMemo(() => {
    const edgesArr = [];
    const ensureArray = (value) => (Array.isArray(value) ? value : []);
    const optimisticRel = buildOptimisticRelationships(optimisticLinks);
    filteredMembers.forEach((member) => {
      const memberId = getMemberId(member);
      if (!memberId) return;

      const baseRel = member.relationships || {};
      const extraRel = optimisticRel.get(memberId) || { parents: [], children: [], spouse: [], siblings: [] };
      const mergedRel = {
        parents: [...ensureArray(baseRel.parents), ...extraRel.parents],
        children: [...ensureArray(baseRel.children), ...extraRel.children],
        spouse: [...ensureArray(baseRel.spouse), ...extraRel.spouse],
        siblings: [...ensureArray(baseRel.siblings), ...extraRel.siblings]
      };

      ensureArray(mergedRel.children).forEach((childId) => {
        const childIdStr = String(childId);
        if (filteredMembers.find(m => getMemberId(m) === childIdStr)) {
          edgesArr.push({
            id: `${memberId}-${childIdStr}`,
            source: memberId,
            target: childIdStr,
            type: 'smoothstep',
            animated: true,
            style: {
              stroke: '#4F46E5',
              strokeWidth: 3,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#4F46E5',
            },
            data: {
              relationship: 'parent'
            }
          });
        }
      });

      ensureArray(mergedRel.spouse).forEach((spouseId) => {
        const spouseIdStr = String(spouseId);
        if (filteredMembers.find(m => getMemberId(m) === spouseIdStr) && memberId < spouseIdStr) {
          edgesArr.push({
            id: `${memberId}-${spouseIdStr}-spouse`,
            source: memberId,
            target: spouseIdStr,
            type: 'straight',
            animated: false,
            style: {
              stroke: '#EC4899',
              strokeWidth: 3,
              strokeDasharray: '8,8'
            },
            label: '💕',
            labelStyle: {
              fontSize: 16,
              fill: '#EC4899',
              fontWeight: 'bold',
            },
            labelBgStyle: {
              fill: 'white',
              fillOpacity: 0.9,
            },
            data: {
              relationship: 'spouse'
            }
          });
        }
      });

      ensureArray(mergedRel.siblings).forEach((siblingId) => {
        const siblingIdStr = String(siblingId);
        if (filteredMembers.find(m => getMemberId(m) === siblingIdStr) && memberId < siblingIdStr) {
          edgesArr.push({
            id: `${memberId}-${siblingIdStr}-sibling`,
            source: memberId,
            target: siblingIdStr,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: '#94A3B8',
              strokeWidth: 2,
              strokeDasharray: '6,6'
            },
            data: {
              relationship: 'sibling'
            }
          });
        }
      });
    });
    return edgesArr;
  }, [filteredMembers, optimisticLinks]);

  useEffect(() => {
    if (optimisticLinks.length === 0) return;

    const hasLink = (memberId, targetId, uiType) => {
      const member = normalizedMembers.find((m) => getMemberId(m) === memberId);
      if (!member) return false;
      const rel = member.relationships || {};
      if (uiType === 'parent') return rel.children?.includes(targetId);
      if (uiType === 'child') return rel.parents?.includes(targetId);
      if (uiType === 'spouse') return rel.spouse?.includes(targetId);
      if (uiType === 'sibling') return rel.siblings?.includes(targetId);
      return false;
    };

    setOptimisticLinks((prev) => prev.filter((link) => !hasLink(link.memberId, link.targetId, link.uiType)));
  }, [normalizedMembers, optimisticLinks]);

  const [nodesState, setNodes, onNodesChange] = useNodesState([]);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState([]);

  const layoutResult = useMemo(() => {
    if (nodes.length === 0) {
      return { nodes: [], edges: [] };
    }

    if (!autoLayout) {
      const columns = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(nodes.length))));
      const gridNodes = layoutNodesInGrid(nodes, columns);
      const gridMap = new Map(gridNodes.map(node => [node.id, node.position]));

      return {
        nodes: nodes.map((node) => {
          const pos = node.data?.member?.treePosition;
          if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
            return { ...node, position: { x: pos.x, y: pos.y } };
          }
          const fallback = gridMap.get(node.id) || node.position;
          return { ...node, position: fallback };
        }),
        edges
      };
    }

    const layoutEdges = edges.filter(edge => edge.data?.relationship !== 'spouse');
    if (layoutEdges.length > 0) {
      return getLayoutedElements(nodes, edges, 'TB', layoutEdges);
    }

    const columns = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(nodes.length))));
    return { nodes: layoutNodesInGrid(nodes, columns), edges };
  }, [nodes, edges, autoLayout]);

  useEffect(() => {
    setNodes((prevNodes) => (areNodesDifferent(prevNodes, layoutResult.nodes) ? layoutResult.nodes : prevNodes));
    setEdges((prevEdges) => (areEdgesDifferent(prevEdges, layoutResult.edges) ? layoutResult.edges : prevEdges));
  }, [layoutResult.nodes, layoutResult.edges, setNodes, setEdges]);

  useEffect(() => {
    if (reactFlowInstance && nodesState.length > 0) {
      reactFlowInstance.fitView({ padding: 0.2, includeHiddenNodes: false });
    }
  }, [reactFlowInstance, nodesState]);

  const inviteMutation = useMutation({
    mutationFn: ({ email, role }) => familyAPI.inviteMember(familyId, email, role),
    onSuccess: (response) => {
      const token = response?.data?.invite?.token || null;
      setInviteToken(token);
      setInviteForm({ email: '', role: 'viewer' });
      toast.success('Invitation created');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to invite member';
      toast.error(message);
    }
  });

  const addRelationshipMutation = useMutation({
    mutationFn: (data) => memberAPI.addRelationship(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['family-members', familyId]);
      if (!variables?.skipUndo) {
        pushUndoAction({
          action: 'add',
          memberId: variables?.memberId,
          targetId: variables?.targetId,
          uiType: variables?.uiType || relationshipForm.type
        });
      }
      setRelationshipStatus({ type: 'success', message: 'Relationship added.' });
      toast.success('Relationship added');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to add relationship';
      setRelationshipStatus({ type: 'error', message });
      toast.error(message);
    }
  });

  const removeRelationshipMutation = useMutation({
    mutationFn: (data) => memberAPI.removeRelationship(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['family-members', familyId]);
      if (!variables?.skipUndo) {
        pushUndoAction({
          action: 'remove',
          memberId: variables?.memberId,
          targetId: variables?.targetId,
          uiType: variables?.uiType || relationshipForm.type
        });
      }
      setRelationshipStatus({ type: 'success', message: 'Relationship removed.' });
      toast.success('Relationship removed');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to remove relationship';
      setRelationshipStatus({ type: 'error', message });
      toast.error(message);
    }
  });

  const updateMemberPositionMutation = useMutation({
    mutationFn: ({ memberId, position }) => memberAPI.update(memberId, { treePosition: position }),
    onSuccess: () => {
      queryClient.invalidateQueries(['family-members', familyId]);
    },
    onError: () => {
      toast.error('Failed to save position');
    }
  });

  const handleConnect = useCallback((connection) => {
    const sourceId = String(connection.source || '');
    const targetId = String(connection.target || '');
    if (!sourceId || !targetId || sourceId === targetId) {
      toast.error('Please connect two different members');
      return;
    }

    const uiType = relationshipForm.type || 'parent';
    setOptimisticLinks((prev) => ([...prev, { memberId: sourceId, targetId, uiType }]));
    setRelationshipStatus({ type: 'info', message: 'Saving relationship...' });

    const payload = { ...buildPayloadFromUiType(sourceId, targetId, uiType), uiType };
    addRelationshipMutation.mutate(payload, {
      onError: () => {
        setOptimisticLinks((prev) => prev.filter((link) => !(link.memberId === sourceId && link.targetId === targetId && link.uiType === uiType)));
      }
    });
  }, [addRelationshipMutation, relationshipForm.type]);

  const handleUndo = useCallback(() => {
    const [lastAction, ...rest] = undoStack;
    if (!lastAction) return;
    setUndoStack(rest);

    const payload = { ...buildPayloadFromUiType(lastAction.memberId, lastAction.targetId, lastAction.uiType), uiType: lastAction.uiType, skipUndo: true };
    if (lastAction.action === 'add') {
      removeRelationshipMutation.mutate(payload);
    } else {
      addRelationshipMutation.mutate(payload);
    }
  }, [undoStack, addRelationshipMutation, removeRelationshipMutation]);

  const handleNodeDragStop = useCallback((_, node) => {
    if (autoLayout) return;
    const memberId = node?.id;
    if (!memberId) return;

    updateMemberPositionMutation.mutate({
      memberId,
      position: { x: node.position.x, y: node.position.y }
    });
  }, [autoLayout, updateMemberPositionMutation]);

  const nodeTypes = useMemo(() => ({ familyNode: FamilyNode }), []);

  let content = null;
  if (!familyIdParam && families.length === 0 && !isLoading) {
    content = (
      <div className="flex flex-col justify-center items-center min-h-[600px] text-center">
        <Users size={80} className="text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Families Yet</h2>
        <p className="text-gray-600 mb-6">Create your first family to start building your family tree</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-primary"
        >
          Go to Dashboard
        </button>
      </div>
    );
  } else if (isLoading) {
    content = (
      <div className="flex justify-center items-center min-h-[600px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {content ? content : (
        <>
          <motion.div
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div>
              <h1 className="text-3xl font-bold gradient-text">Family Tree</h1>
              <p className="text-gray-600 mt-1">Visualize your family connections</p>
            </div>
            <div className="flex gap-3 items-center">
              {families.length > 0 && (
                <select
                  value={selectedFamilyId || ''}
                  onChange={(e) => setSelectedFamilyId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name} Family
                    </option>
                  ))}
                </select>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary flex items-center gap-2"
                disabled={!familyId}
                title="Add a new family member"
              >
                <Plus size={20} />
                Add Member
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setInviteToken(null);
                  setShowInviteModal(true);
                }}
                className="btn btn-outline flex items-center gap-2"
                disabled={!familyId}
                title="Invite a family member"
              >
                <UserPlus size={20} />
                Invite
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-4 items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'male', 'female'].map((gender) => (
                <motion.button
                  key={gender}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterGender(gender)}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                    filterGender === gender
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {gender}
                </motion.button>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {filteredMembers.length} members
            </div>
          </motion.div>

          {members.length > 0 && (
            <motion.div
              className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-lg p-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">✨</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary-900 mb-1">Auto-Layout Active</h4>
                  <p className="text-sm text-primary-700">
                    Your family tree is automatically organized hierarchically. Click any member to view details, or hover to edit.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            className="card p-0 overflow-hidden relative"
            style={{ height: '700px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary-200/40 blur-3xl rounded-full" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-200/40 blur-3xl rounded-full" />
            </div>
            {members.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Users size={64} className="mx-auto text-gray-300 mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No family members yet</h3>
                  <p className="text-gray-600 mb-6">Start building your family tree!</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Add First Member
                  </motion.button>
                </div>
              </div>
            ) : (
              <>
                {filteredMembers.length === 0 && members.length > 0 && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 p-6 text-center shadow-lg">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No members match your filters</h4>
                      <p className="text-sm text-gray-600 mb-4">Clear the search or gender filter to show everyone.</p>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterGender('all');
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  </div>
                )}
                <ReactFlow
                  className="relative z-10"
                  nodes={nodesState}
                  edges={edgesState}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={handleConnect}
                  onNodeDragStop={handleNodeDragStop}
                  nodesDraggable={!autoLayout}
                  nodeTypes={nodeTypes}
                  onInit={setReactFlowInstance}
                  fitView
                  fitViewOptions={{
                    padding: 0.2,
                    includeHiddenNodes: false,
                  }}
                  attributionPosition="bottom-left"
                  minZoom={0.1}
                  maxZoom={1.5}
                  defaultEdgeOptions={{
                    animated: false,
                    style: { stroke: '#3B82F6', strokeWidth: 2 },
                  }}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background
                    color="#CBD5F5"
                    gap={24}
                    size={1}
                    variant="dots"
                  />
                  <Controls
                    showInteractive={false}
                    className="bg-white rounded-lg shadow-lg border border-gray-200"
                  />
                  <MiniMap
                    nodeColor={(node) => {
                      const gender = node.data.member?.gender;
                      if (gender === 'male') return '#3B82F6';
                      if (gender === 'female') return '#EC4899';
                      return '#A855F7';
                    }}
                    nodeStrokeWidth={3}
                    maskColor="rgba(0, 0, 0, 0.1)"
                    className="bg-white rounded-lg shadow-lg border border-gray-200"
                    style={{
                      backgroundColor: 'white',
                    }}
                  />
                </ReactFlow>
              </>
            )}
          </motion.div>

          {members.length > 1 && (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Relationship Builder</h3>
                  <p className="text-sm text-gray-600">Connect parents, children, spouses, or siblings to reveal the tree structure.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      undoStack.length === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                  >
                    Undo
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoLayout((prev) => !prev)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      autoLayout
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-gray-900 text-white'
                    }`}
                  >
                    {autoLayout ? 'Auto Layout On' : 'Manual Layout'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRelationshipMode('add')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      relationshipMode === 'add'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Link2 size={16} className="inline mr-2" />
                    Add Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setRelationshipMode('remove')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      relationshipMode === 'remove'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Unlink size={16} className="inline mr-2" />
                    Remove Link
                  </button>
                </div>
              </div>

              <form
                className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!relationshipForm.memberId || !relationshipForm.targetId) {
                    toast.error('Pick two members to connect');
                    return;
                  }
                  const memberExists = members.some(member => getMemberId(member) === relationshipForm.memberId);
                  const targetExists = members.some(member => getMemberId(member) === relationshipForm.targetId);
                  if (!memberExists || !targetExists) {
                    toast.error('Please reselect both members');
                    return;
                  }
                  if (relationshipForm.memberId === relationshipForm.targetId) {
                    toast.error('Please choose two different members');
                    return;
                  }
                  setRelationshipStatus({ type: 'info', message: 'Saving relationship...' });
                  const payload = {
                    ...buildPayloadFromUiType(
                      relationshipForm.memberId,
                      relationshipForm.targetId,
                      relationshipForm.type
                    ),
                    uiType: relationshipForm.type
                  };
                  const uiType = relationshipForm.type;
                  setOptimisticLinks((prev) => ([...prev, {
                    memberId: relationshipForm.memberId,
                    targetId: relationshipForm.targetId,
                    uiType
                  }]));
                  if (relationshipMode === 'add') {
                    addRelationshipMutation.mutate(payload, {
                      onError: () => {
                        setOptimisticLinks((prev) => prev.filter((link) => !(
                          link.memberId === relationshipForm.memberId &&
                          link.targetId === relationshipForm.targetId &&
                          link.uiType === uiType
                        )));
                      }
                    });
                  } else {
                    removeRelationshipMutation.mutate(payload, {
                      onSuccess: () => {
                        setOptimisticLinks((prev) => prev.filter((link) => !(
                          link.memberId === relationshipForm.memberId &&
                          link.targetId === relationshipForm.targetId &&
                          link.uiType === uiType
                        )));
                      },
                      onError: () => {
                        setOptimisticLinks((prev) => prev.filter((link) => !(
                          link.memberId === relationshipForm.memberId &&
                          link.targetId === relationshipForm.targetId &&
                          link.uiType === uiType
                        )));
                      }
                    });
                  }
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Member</label>
                  <select
                    className="input"
                    value={relationshipForm.memberId}
                    onChange={(e) => setRelationshipForm(prev => ({ ...prev, memberId: e.target.value }))}
                  >
                    <option value="">Select a member</option>
                    {members.map((member) => {
                      const memberId = getMemberId(member);
                      if (!memberId) return null;
                      return (
                        <option key={memberId} value={memberId}>
                          {member.firstName} {member.lastName}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                  <select
                    className="input"
                    value={relationshipForm.type}
                    onChange={(e) => setRelationshipForm(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="spouse">Spouse</option>
                    <option value="sibling">Sibling</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target</label>
                  <select
                    className="input"
                    value={relationshipForm.targetId}
                    onChange={(e) => setRelationshipForm(prev => ({ ...prev, targetId: e.target.value }))}
                  >
                    <option value="">Select a member</option>
                    {members.map((member) => {
                      const memberId = getMemberId(member);
                      if (!memberId) return null;
                      return (
                        <option key={memberId} value={memberId}>
                          {member.firstName} {member.lastName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="md:col-span-3 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className={`btn ${relationshipMode === 'add' ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={addRelationshipMutation.isLoading || removeRelationshipMutation.isLoading}
                  >
                    {addRelationshipMutation.isLoading || removeRelationshipMutation.isLoading
                      ? 'Saving...'
                      : (relationshipMode === 'add' ? 'Create Relationship' : 'Remove Relationship')}
                  </button>
                  <div className="text-sm text-gray-500 flex items-center">
                    Tip: Use Parent/Child to build generations. Spouse links draw a dashed connector.
                  </div>
                  {computedRelationship?.label && (
                    <div className="text-sm px-3 py-2 rounded-lg border bg-indigo-50 border-indigo-200 text-indigo-700">
                      Auto relationship: {computedRelationship.label}
                    </div>
                  )}
                  {relationshipStatus && (
                    <div className={`text-sm px-3 py-2 rounded-lg border ${
                      relationshipStatus.type === 'error'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : relationshipStatus.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                      {relationshipStatus.message}
                    </div>
                  )}
                </div>
              </form>
            </motion.div>
          )}

          <AddMemberModal
            isOpen={showAddModal || selectedMember}
            onClose={() => {
              setShowAddModal(false);
              setSelectedMember(null);
            }}
            familyId={familyId}
            member={selectedMember}
          />

          {showInviteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteToken(null);
                }}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Invite Family Member</h3>
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteToken(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!inviteForm.email.trim()) {
                      toast.error('Email is required');
                      return;
                    }
                    inviteMutation.mutate(inviteForm);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      className="input"
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {inviteToken && (
                    <div className="rounded-lg bg-primary-50 border border-primary-200 p-3 text-sm text-primary-700">
                      Invite token: <span className="font-semibold">{inviteToken}</span>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      className="btn btn-secondary flex-1"
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteToken(null);
                      }}
                    >
                      Close
                    </button>
                    <button type="submit" className="btn btn-primary flex-1" disabled={inviteMutation.isLoading}>
                      {inviteMutation.isLoading ? 'Sending...' : 'Send Invite'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary-600">{members.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Members</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-blue-600">
                {members.filter(m => m.gender === 'male').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Males</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-pink-600">
                {members.filter(m => m.gender === 'female').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Females</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.max(...members.map(m => {
                  const getGeneration = (member, depth = 0) => {
                    const parents = member.relationships?.parents?.length || 0;
                    return parents > 0 ? depth + 1 : depth;
                  };
                  return getGeneration(m);
                }), 0) + 1}
              </div>
              <div className="text-sm text-gray-600 mt-1">Generations</div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
