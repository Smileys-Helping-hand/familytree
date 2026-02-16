import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { memberAPI, memoryAPI } from '../services/api';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, Heart, Users, 
  Camera, Share2, UserPlus, Cake, Clock, Book
} from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { buildMemberIndex, computeRelationshipLabel } from '../utils/relationshipCalculator';

export default function MemberProfile() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('about');

  const { data: memberData, isLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => memberAPI.getOne(memberId),
  });

  const { data: memoriesData } = useQuery({
    queryKey: ['member-memories', memberId],
    queryFn: () => memoryAPI.getAll(memberData?.data?.member?.familyId),
    enabled: !!memberData?.data?.member?.familyId,
  });

  const member = memberData?.data?.member;
  const relatedMemories = memoriesData?.data?.memories?.filter((memory) => {
    const tagged = memory.taggedMembers || [];
    return tagged.some((tag) => {
      if (typeof tag === 'string') return tag === memberId;
      return tag.memberId === memberId || tag.member === memberId || tag.id === memberId;
    });
  }) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"
        />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Member not found</h2>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const age = member.birthDate && member.isLiving !== false
    ? differenceInYears(new Date(), new Date(member.birthDate))
    : null;

  const lifespan = member.birthDate && member.deathDate
    ? differenceInYears(new Date(member.deathDate), new Date(member.birthDate))
    : null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <motion.button
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ x: -4 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={20} />
        Back
      </motion.button>

      {/* Profile Header */}
      <motion.div
        className="card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Photo */}
          <div className="relative">
            {member.photo ? (
              <img
                src={member.photo}
                alt={`${member.firstName} ${member.lastName}`}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary-100 shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-primary-100 shadow-lg">
                {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
              </div>
            )}
            {member.isLiving === false && (
              <div className="absolute bottom-0 right-0 w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white text-xl shadow-lg border-2 border-white">
                †
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-primary-600"
            >
              <Camera size={18} className="text-primary-600" />
            </motion.button>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {member.firstName} {member.lastName}
                </h1>
                <p className="text-gray-600">
                  {member.gender && <span className="capitalize">{member.gender}</span>}
                  {age && <span> • {age} years old</span>}
                  {lifespan && <span> (lived {lifespan} years)</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-outline flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-outline flex items-center gap-2"
                >
                  <Share2 size={18} />
                  Share
                </motion.button>
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {member.birthDate && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Cake className="text-primary-600" size={20} />
                  </div>
                  <div>
                    <div className="text-gray-500">Born</div>
                    <div className="font-medium text-gray-900">
                      {format(new Date(member.birthDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              )}

              {member.deathDate && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-gray-600" size={20} />
                  </div>
                  <div>
                    <div className="text-gray-500">Died</div>
                    <div className="font-medium text-gray-900">
                      {format(new Date(member.deathDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              )}

              {member.email && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <div className="text-gray-500">Email</div>
                    <div className="font-medium text-gray-900 truncate">{member.email}</div>
                  </div>
                </div>
              )}

              {member.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="text-green-600" size={20} />
                  </div>
                  <div>
                    <div className="text-gray-500">Phone</div>
                    <div className="font-medium text-gray-900">{member.phone}</div>
                  </div>
                </div>
              )}

              {member.birthDate?.location && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <div className="text-gray-500">Birthplace</div>
                    <div className="font-medium text-gray-900">{member.birthDate.location}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="border-b border-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex gap-8">
          {[
            { id: 'about', label: 'About', icon: Book },
            { id: 'family', label: 'Family', icon: Users },
            { id: 'memories', label: 'Memories', icon: Heart },
            { id: 'timeline', label: 'Timeline', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ y: -2 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'about' && <AboutTab member={member} />}
        {activeTab === 'family' && <FamilyTab member={member} />}
        {activeTab === 'memories' && <MemoriesTab memories={relatedMemories} />}
        {activeTab === 'timeline' && <TimelineTab member={member} />}
      </motion.div>
    </div>
  );
}

// About Tab Component
function AboutTab({ member }) {
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Biography</h2>
      {member.biography ? (
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {member.biography}
        </p>
      ) : (
        <p className="text-gray-500 italic">No biography available yet.</p>
      )}

      {member.occupation && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-2">Occupation</h3>
          <p className="text-gray-700">{member.occupation}</p>
        </div>
      )}

      {member.education && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-2">Education</h3>
          <p className="text-gray-700">{member.education}</p>
        </div>
      )}
    </div>
  );
}

// Family Tab Component
function FamilyTab({ member }) {
  const navigate = useNavigate();
  const { data: familyMembersData } = useQuery({
    queryKey: ['family-members', member.familyId],
    queryFn: () => memberAPI.getAll(member.familyId),
  });

  const allMembers = familyMembersData?.data?.members || [];
  const getMemberId = (data) => String(data?.id || data?._id || '');
  const memberIndex = useMemo(() => buildMemberIndex(allMembers, getMemberId), [allMembers]);
  const memberId = getMemberId(member);

  const parents = allMembers.filter(m => 
    member.relationships?.parents?.includes(getMemberId(m))
  );

  const siblings = allMembers.filter(m =>
    m.relationships?.parents?.some(p => member.relationships?.parents?.includes(p))
    && getMemberId(m) !== memberId
  );

  const spouses = allMembers.filter(m => 
    member.relationships?.spouse?.includes(getMemberId(m))
  );

  const children = allMembers.filter(m => 
    member.relationships?.children?.includes(getMemberId(m))
  );

  const directIds = new Set([
    ...parents.map(getMemberId),
    ...siblings.map(getMemberId),
    ...spouses.map(getMemberId),
    ...children.map(getMemberId)
  ]);

  const extendedRelations = useMemo(() => {
    if (!memberId) return [];
    return allMembers
      .filter((m) => {
        const id = getMemberId(m);
        return id && id !== memberId && !directIds.has(id);
      })
      .map((relMember) => ({
        member: relMember,
        relationship: computeRelationshipLabel(memberId, getMemberId(relMember), memberIndex).label
      }))
      .sort((a, b) => a.relationship.localeCompare(b.relationship));
  }, [allMembers, directIds, memberId, memberIndex]);

  const FamilyMemberCard = ({ member: familyMember, relationship }) => (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={() => navigate(`/member/${getMemberId(familyMember)}`)}
      className="card cursor-pointer hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-4">
        {familyMember.photo ? (
          <img
            src={familyMember.photo}
            alt={familyMember.firstName}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
            {familyMember.firstName?.charAt(0)}{familyMember.lastName?.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {familyMember.firstName} {familyMember.lastName}
          </h3>
          <p className="text-sm text-gray-600">{relationship}</p>
          {familyMember.birthDate && (
            <p className="text-xs text-gray-500">
              b. {format(new Date(familyMember.birthDate), 'yyyy')}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {parents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Parents</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {parents.map(parent => (
              <FamilyMemberCard key={parent.id} member={parent} relationship="Parent" />
            ))}
          </div>
        </div>
      )}

      {spouses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spouse</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {spouses.map(spouse => (
              <FamilyMemberCard key={spouse.id} member={spouse} relationship="Spouse" />
            ))}
          </div>
        </div>
      )}

      {siblings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Siblings</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {siblings.map(sibling => (
              <FamilyMemberCard key={sibling.id} member={sibling} relationship="Sibling" />
            ))}
          </div>
        </div>
      )}

      {children.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Children</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {children.map(child => (
              <FamilyMemberCard key={child.id} member={child} relationship="Child" />
            ))}
          </div>
        </div>
      )}

      {extendedRelations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Extended Relationships</h3>
          <p className="text-sm text-gray-600 mb-4">Auto-calculated across multiple generations.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {extendedRelations.map(({ member: relMember, relationship }) => (
              <FamilyMemberCard
                key={getMemberId(relMember)}
                member={relMember}
                relationship={relationship}
              />
            ))}
          </div>
        </div>
      )}

      {parents.length === 0 && siblings.length === 0 && spouses.length === 0 && children.length === 0 && (
        <div className="card text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-4">No family relationships added yet</p>
          <button className="btn btn-primary inline-flex items-center gap-2">
            <UserPlus size={18} />
            Add Relationships
          </button>
        </div>
      )}
    </div>
  );
}

// Memories Tab Component
function MemoriesTab({ memories }) {
  if (memories.length === 0) {
    return (
      <div className="card text-center py-12">
        <Heart size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600">No memories tagged with this person yet</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {memories.map((memory, index) => (
        <motion.div
          key={memory.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="card p-0 overflow-hidden cursor-pointer"
        >
          {memory.mediaUrl && (
            <div className="aspect-square bg-gray-100">
              {memory.type === 'video' ? (
                <video src={memory.mediaUrl} className="w-full h-full object-cover" />
              ) : (
                <img src={memory.mediaUrl} alt={memory.title} className="w-full h-full object-cover" />
              )}
            </div>
          )}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{memory.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{memory.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Timeline Tab Component
function TimelineTab({ member }) {
  const events = [];

  if (member.birthDate) {
    events.push({
      date: member.birthDate,
      title: 'Born',
      description: '',
      icon: Cake,
      color: 'from-primary-500 to-blue-500',
    });
  }

  if (member.deathDate) {
    events.push({
      date: member.deathDate,
      title: 'Passed Away',
      description: '',
      icon: Clock,
      color: 'from-gray-500 to-gray-700',
    });
  }

  // Sort events by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="card">
      {events.length > 0 ? (
        <div className="space-y-8">
          {events.map((event, index) => {
            const Icon = event.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${event.color} flex items-center justify-center text-white shadow-lg`}>
                    <Icon size={20} />
                  </div>
                  {index < events.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 my-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="text-sm text-gray-500 mb-1">
                    {format(new Date(event.date), 'MMMM d, yyyy')}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-gray-600">{event.description}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No timeline events available</p>
        </div>
      )}
    </div>
  );
}
