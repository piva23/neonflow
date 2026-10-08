import React from 'react';
import { useMember } from './MemberContext';

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useProfile = () => {
  const {
    members,
    activeMember,
    selectMember,
    addMember,
    updateMemberXp,
    incrementMemberListenTime,
  } = useMember();

  return {
    profiles: members,
    activeProfile: activeMember,
    selectProfile: selectMember,
    addProfile: (name: string, role: any, avatar: string, color: string) =>
      addMember(name, role, avatar, color),
    updateXp: updateMemberXp,
    incrementListenTime: incrementMemberListenTime,
  };
};
