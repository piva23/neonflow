import React, { createContext, useContext } from 'react';
import { Member, MemberRole } from '../types';
import { useFamily } from './FamilyContext';

interface MemberContextType {
  members: Member[];
  activeMember: Member | null;
  activeProfile: Member | null;
  activeMemberId: string;
  selectMember: (id: string) => void;
  selectProfile: (id: string) => void;
  addMember: (
    name: string,
    role: MemberRole,
    avatar: string,
    color: string,
    extra?: Partial<Member>
  ) => Member;
  updateMember: (id: string, data: Partial<Member>) => void;
  removeMember: (id: string) => void;
  updateMemberXp: (memberId: string, amount: number) => void;
  incrementMemberListenTime: (memberId: string, minutes: number) => void;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export const MemberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const familyContext = useFamily();

  const value: MemberContextType = {
    members: familyContext.members,
    activeMember: familyContext.activeMember,
    activeProfile: familyContext.activeMember,
    activeMemberId: familyContext.activeMemberId,
    selectMember: familyContext.selectMember,
    selectProfile: familyContext.selectMember,
    addMember: familyContext.addMember,
    updateMember: familyContext.updateMember,
    removeMember: familyContext.removeMember,
    updateMemberXp: familyContext.addXp,
    incrementMemberListenTime: familyContext.incrementMemberListenTime,
  };

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
};

export const useMember = () => {
  const familyContext = useFamily();
  return {
    members: familyContext.members,
    activeMember: familyContext.activeMember,
    activeProfile: familyContext.activeMember,
    activeMemberId: familyContext.activeMemberId,
    selectMember: familyContext.selectMember,
    selectProfile: familyContext.selectMember,
    addMember: familyContext.addMember,
    updateMember: familyContext.updateMember,
    removeMember: familyContext.removeMember,
    updateMemberXp: familyContext.addXp,
    incrementMemberListenTime: familyContext.incrementMemberListenTime,
  };
};
