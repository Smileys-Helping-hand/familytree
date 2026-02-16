import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { Edit, Heart } from 'lucide-react';

/**
 * Custom React Flow Node Component for Family Tree
 * Displays member information in a card format with handles for connections
 */
const FamilyNode = memo(({ data }) => {
  const { member, onEdit, onClick } = data;

  // Calculate age or lifespan
  const getYearDisplay = () => {
    if (!member.birthDate && !member.deathDate) return '';
    
    const birthYear = member.birthDate ? new Date(member.birthDate).getFullYear() : '?';
    const deathYear = member.deathDate ? new Date(member.deathDate).getFullYear() : '';
    
    if (member.isLiving === false || member.deathDate) {
      return `${birthYear} - ${deathYear}`;
    }
    return `b. ${birthYear}`;
  };

  return (
    <>
      {/* Top Handle - for incoming connections (parents) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary-600 !border-2 !border-white"
        style={{ top: -6 }}
      />

      {/* Card Container */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05, zIndex: 1000 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={onClick}
        className="relative bg-white rounded-xl shadow-lg border-2 border-primary-200 hover:border-primary-500 transition-all duration-200 cursor-pointer overflow-hidden group"
        style={{ width: 200 }}
      >
        {/* Living Status Indicator */}
        {member.isLiving !== false && (
          <div className="absolute top-2 right-2 z-10">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 bg-green-500 rounded-full shadow-lg"
              title="Living"
            />
          </div>
        )}

        {/* Deceased Indicator */}
        {(member.isLiving === false || member.deathDate) && (
          <div className="absolute top-2 right-2 z-10 w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center text-white text-sm shadow-lg border-2 border-white">
            †
          </div>
        )}

        {/* Card Content */}
        <div className="p-4">
          {/* Profile Photo */}
          <div className="flex justify-center mb-3">
            {member.photo ? (
              <img
                src={member.photo}
                alt={`${member.firstName} ${member.lastName}`}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-primary-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md ring-2 ring-primary-200">
                {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
              </div>
            )}
          </div>

          {/* Name */}
          <div className="text-center mb-2">
            <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1" title={`${member.firstName} ${member.lastName}`}>
              {member.firstName}
            </h3>
            <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1" title={`${member.firstName} ${member.lastName}`}>
              {member.lastName}
            </h3>
          </div>

          {/* Years */}
          {getYearDisplay() && (
            <div className="text-center mb-3">
              <p className="text-xs text-gray-600 font-medium">
                {getYearDisplay()}
              </p>
            </div>
          )}

          {/* Gender Badge */}
          <div className="flex justify-center mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              member.gender === 'male' 
                ? 'bg-blue-100 text-blue-700' 
                : member.gender === 'female'
                ? 'bg-pink-100 text-pink-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {member.gender === 'male' ? '♂' : member.gender === 'female' ? '♀' : '⚥'}
            </span>
          </div>

          {/* Edit Button - Shows on Hover */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100"
          >
            <Edit size={14} />
            <span>Edit</span>
          </motion.button>
        </div>

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </motion.div>

      {/* Bottom Handle - for outgoing connections (children) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary-600 !border-2 !border-white"
        style={{ bottom: -6 }}
      />
    </>
  );
});

FamilyNode.displayName = 'FamilyNode';

export default FamilyNode;
