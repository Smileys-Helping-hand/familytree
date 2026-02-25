import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { familyAPI, memberAPI } from '../services/api';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import FamilyNode from '../components/FamilyNode';
import MemberDetailsPanel from '../components/MemberDetailsPanel';
import { getLayoutedElements } from '../utils/treeLayout';

export default function SharedTree() {
  const { familyId } = useParams();
  const navigate = useNavigate();
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedMemberDetails, setSelectedMemberDetails] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const famRes = await familyAPI.getAll();
      const fam = famRes.data.families.find(f => f.id === familyId);
      setFamily(fam);
      const memRes = await memberAPI.getAll(familyId);
      setMembers(memRes.data.members || []);
    }
    fetchData();
  }, [familyId]);

  useEffect(() => {
    if (members.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }
    // Build nodes and edges
    const nodes = useMemo(() => members.map((member) => ({
      id: String(member.id),
      type: 'familyNode',
      data: {
        member,
        isReadOnly: true,
        onClick: () => handleNodeClick(member),
      },
      position: { x: 0, y: 0 }
    })), [members]);
    const edges = [];
    members.forEach(member => {
      const rel = member.relationships || {};
      (rel.children || []).forEach(childId => {
        edges.push({
          id: `${member.id}-${childId}`,
          source: String(member.id),
          target: String(childId),
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#4F46E5', strokeWidth: 3 },
        });
      });
      (rel.spouse || []).forEach(spouseId => {
        if (member.id < spouseId) {
          edges.push({
            id: `${member.id}-${spouseId}-spouse`,
            source: String(member.id),
            target: String(spouseId),
            type: 'straight',
            animated: false,
            style: { stroke: '#EC4899', strokeWidth: 3, strokeDasharray: '8,8' },
            label: '💕',
            labelStyle: { fontSize: 16, fill: '#EC4899', fontWeight: 'bold' },
            labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
          });
        }
      });
    });
    const layout = getLayoutedElements(nodes, edges, 'TB', edges.filter(e => !e.id.endsWith('-spouse')));
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [members]);

  const handleNodeClick = (member) => {
    setSelectedMemberDetails(member);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <header className="w-full py-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center shadow-lg">
        <h1 className="text-3xl font-bold mb-2">{family ? `${family.name} Tree` : 'Family Tree'} - Powered by FamilyVerse</h1>
        <button
          className="mt-2 px-6 py-2 rounded-lg bg-white text-blue-600 font-semibold shadow hover:bg-blue-50"
          onClick={() => navigate('/dashboard')}
        >
          Build your own
        </button>
      </header>
      <div className="w-full max-w-6xl mx-auto mt-8 bg-white rounded-xl shadow-xl p-6">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={{ familyNode: FamilyNode }}
          nodesConnectable={false}
          nodesDraggable={true}
          elementsSelectable={false}
          fitView
          minZoom={0.1}
          maxZoom={1.5}
          style={{ height: '700px', background: '#F3F4F6' }}
        >
          <Background color="#CBD5F5" gap={24} size={1} variant="dots" />
          <Controls showInteractive={false} className="bg-white rounded-lg shadow-lg border border-gray-200" />
          <MiniMap
            nodeColor={node => {
              const gender = node.data.member?.gender;
              if (gender === 'male') return '#3B82F6';
              if (gender === 'female') return '#EC4899';
              return '#A855F7';
            }}
            nodeStrokeWidth={3}
            maskColor="rgba(0, 0, 0, 0.1)"
            className="bg-white rounded-lg shadow-lg border border-gray-200"
            style={{ backgroundColor: 'white' }}
          />
        </ReactFlow>
        <MemberDetailsPanel
          member={selectedMemberDetails}
          isOpen={!!selectedMemberDetails}
          onClose={() => setSelectedMemberDetails(null)}
          isReadOnly={true}
        />
      </div>
    </div>
  );
}
