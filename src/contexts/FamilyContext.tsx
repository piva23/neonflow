import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Family, FamilySettings, Member, MemberRole } from '../types';
import { storage } from '../services/storage';
import { runStorageMigration } from '../services/migration';

// Run storage migration on module load
runStorageMigration();

const EMPTY_FAMILY: Family = {
  id: '',
  name: 'Nenhuma Família',
  familyName: 'Nenhuma Família',
  photo: '🏠',
  color: '#8338ec',
  description: 'Crie uma família para começar',
  inviteCode: '',
  createdAt: new Date().toISOString(),
  members: [],
  settings: {
    autoSync: true,
    defaultGenre: 'Pop',
    allowExplicitContent: false,
    themeColor: '#8338ec',
    maxMembersLimit: 8,
  },
  favoriteGenres: [],
  favoriteMoods: [],
  statistics: {
    totalListenTime: 0,
    totalTracks: 0,
    totalPlaylists: 0,
    totalMembers: 0,
    topGenre: '-',
    topMood: '-',
    xp: 0,
    achievementsCount: 0,
  },
};

interface FamilyDataStore {
  families: Family[];
  activeFamilyId: string;
  activeMemberId: string;
}

interface FamilyContextType {
  // Family State
  family: Family;
  activeFamily: Family;
  families: Family[];
  hasFamily: boolean;

  // Family Operations
  selectFamily: (id: string) => void;
  createFamily: (
    name: string,
    photo: string,
    color: string,
    description: string,
    initialMemberName?: string,
    initialMemberRole?: MemberRole
  ) => Family;
  updateFamily: (id: string, data: Partial<Family>) => void;
  deleteFamily: (id: string) => void;
  duplicateFamily: (id: string) => Family;
  updateFamilySettings: (settings: Partial<FamilySettings>) => void;
  regenerateInviteCode: () => void;
  recalculateFamilyStats: (trackCount?: number, playlistCount?: number) => void;

  // Member State (Single Source of Truth)
  members: Member[];
  activeMember: Member | null;
  activeMemberId: string;

  // Member Operations
  selectMember: (id: string) => void;
  addMember: (
    name: string,
    role: MemberRole,
    avatar: string,
    color: string,
    extra?: Partial<Member>
  ) => Member;
  updateMember: (id: string, data: Partial<Member>) => void;
  removeMember: (id: string) => void;
  moveMember: (memberId: string, targetFamilyId: string) => void;
  addXp: (memberId: string, amount: number) => void;
  updateMemberXp: (memberId: string, amount: number) => void;
  incrementMemberListenTime: (memberId: string, minutes: number) => void;
  updateFamilyMembersInStore: (members: Member[]) => void;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Single Store State loaded from 'family_data'
  const [store, setStore] = useState<FamilyDataStore>(() => {
    const defaultData: FamilyDataStore = {
      families: [],
      activeFamilyId: '',
      activeMemberId: '',
    };

    return storage.load<FamilyDataStore>('family_data', defaultData);
  });

  // Persist store to 'family_data' whenever store changes
  useEffect(() => {
    storage.save('family_data', store);
  }, [store]);

  const hasFamily = store.families.length > 0;

  // Derived active family
  const activeFamily = useMemo(() => {
    if (!hasFamily) return EMPTY_FAMILY;
    const found = store.families.find((f) => f.id === store.activeFamilyId);
    if (found) return found;
    return store.families[0] || EMPTY_FAMILY;
  }, [store.families, store.activeFamilyId, hasFamily]);

  // Derived members list from active family
  const members = useMemo(() => {
    if (!hasFamily) return [];
    return activeFamily.members || [];
  }, [activeFamily.members, hasFamily]);

  // Derived active member
  const activeMember = useMemo(() => {
    if (!hasFamily || members.length === 0) return null;
    const found = members.find((m) => m.id === store.activeMemberId);
    return found || members[0] || null;
  }, [members, store.activeMemberId, hasFamily]);

  // ================= FAMILY OPERATIONS =================
  const selectFamily = useCallback((id: string) => {
    setStore((prev) => {
      const exists = prev.families.some((f) => f.id === id);
      if (!exists) return prev;
      const targetFam = prev.families.find((f) => f.id === id);
      const firstMemberId = targetFam?.members?.[0]?.id || '';
      return {
        ...prev,
        activeFamilyId: id,
        activeMemberId: firstMemberId,
      };
    });
  }, []);

  const createFamily = useCallback((
    name: string,
    photo: string,
    color: string,
    description: string,
    initialMemberName?: string,
    initialMemberRole?: MemberRole
  ): Family => {
    const now = new Date().toISOString();
    const newId = `fam-${Date.now()}`;
    const initialMemberId = `m-${Date.now()}`;

    const initialMember: Member = {
      id: initialMemberId,
      name: initialMemberName?.trim() || 'Você',
      role: initialMemberRole || 'Pai',
      avatar: '👑',
      color: color || '#8338ec',
      createdAt: now,
      xp: 100,
      level: 1,
      streak: 1,
      listenTime: 0,
      statistics: {
        listenTime: 0,
        totalFavorites: 0,
        playlistsCreated: 0,
        tracksAdded: 0,
      },
    };

    const newFam: Family = {
      id: newId,
      name: name.trim() || 'Minha Família',
      familyName: name.trim() || 'Minha Família',
      photo: photo || '🏠',
      color: color || '#8338ec',
      description: description || 'Nossa família musical no NeonFlow',
      inviteCode: `NF-${Math.floor(100 + Math.random() * 900)}-${Math.random()
        .toString(36)
        .substring(2, 5)
        .toUpperCase()}`,
      createdAt: now,
      members: [initialMember],
      settings: {
        autoSync: true,
        defaultGenre: 'Pop',
        allowExplicitContent: false,
        themeColor: color || '#8338ec',
        maxMembersLimit: 8,
      },
      favoriteGenres: ['Pop', 'Rock'],
      favoriteMoods: ['Family Time', 'Happy'],
      statistics: {
        totalListenTime: 0,
        totalTracks: 0,
        totalPlaylists: 0,
        totalMembers: 1,
        topGenre: 'Geral',
        topMood: 'Family Time',
        xp: 100,
        achievementsCount: 0,
      },
    };

    setStore((prev) => ({
      ...prev,
      families: [...prev.families, newFam],
      activeFamilyId: newId,
      activeMemberId: initialMemberId,
    }));

    return newFam;
  }, []);

  const updateFamily = useCallback((id: string, data: Partial<Family>) => {
    setStore((prev) => ({
      ...prev,
      families: prev.families.map((f) => {
        if (f.id === id) {
          const updatedName = data.name || data.familyName || f.name;
          return {
            ...f,
            ...data,
            name: updatedName,
            familyName: updatedName,
          };
        }
        return f;
      }),
    }));
  }, []);

  const deleteFamily = useCallback((id: string) => {
    setStore((prev) => {
      const filtered = prev.families.filter((f) => f.id !== id);
      if (filtered.length === 0) {
        return {
          families: [],
          activeFamilyId: '',
          activeMemberId: '',
        };
      }
      const nextActiveId = prev.activeFamilyId === id ? filtered[0].id : prev.activeFamilyId;
      const nextFam = filtered.find((f) => f.id === nextActiveId);
      const nextMemberId = nextFam?.members?.[0]?.id || '';
      return {
        ...prev,
        families: filtered,
        activeFamilyId: nextActiveId,
        activeMemberId: nextMemberId,
      };
    });
  }, []);

  const duplicateFamily = useCallback((id: string): Family => {
    const target = store.families.find((f) => f.id === id) || activeFamily;
    const newId = `fam-${Date.now()}`;
    const duplicatedMembers: Member[] = (target.members || []).map((m) => ({
      ...m,
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
    }));

    const newFamily: Family = {
      ...target,
      id: newId,
      name: `${target.name || target.familyName} (Cópia)`,
      familyName: `${target.name || target.familyName} (Cópia)`,
      inviteCode: `NF-${Math.floor(100 + Math.random() * 900)}-${Math.random()
        .toString(36)
        .substring(2, 5)
        .toUpperCase()}`,
      createdAt: new Date().toISOString(),
      members: duplicatedMembers,
    };

    setStore((prev) => ({
      ...prev,
      families: [...prev.families, newFamily],
      activeFamilyId: newId,
      activeMemberId: duplicatedMembers[0]?.id || prev.activeMemberId,
    }));

    return newFamily;
  }, [store.families, activeFamily]);

  const updateFamilySettings = useCallback((newSettings: Partial<FamilySettings>) => {
    setStore((prev) => ({
      ...prev,
      families: prev.families.map((f) => {
        if (f.id === prev.activeFamilyId) {
          return {
            ...f,
            settings: { ...f.settings, ...newSettings },
          };
        }
        return f;
      }),
    }));
  }, []);

  const regenerateInviteCode = useCallback(() => {
    const newCode = `NF-${Math.floor(100 + Math.random() * 900)}-${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`;
    updateFamily(store.activeFamilyId, { inviteCode: newCode });
  }, [store.activeFamilyId, updateFamily]);

  const recalculateFamilyStats = useCallback((trackCount?: number, playlistCount?: number) => {
    setStore((prev) => ({
      ...prev,
      families: prev.families.map((f) => {
        if (f.id === prev.activeFamilyId) {
          const famMembers = f.members || [];
          const totalListenTime = famMembers.reduce(
            (sum, m) => sum + (m.statistics?.listenTime || m.listenTime || 0),
            0
          );
          const totalXp = famMembers.reduce((sum, m) => sum + (m.xp || 0), 0);

          return {
            ...f,
            statistics: {
              ...f.statistics,
              totalMembers: famMembers.length,
              totalListenTime,
              totalTracks: trackCount !== undefined ? trackCount : f.statistics.totalTracks,
              totalPlaylists: playlistCount !== undefined ? playlistCount : f.statistics.totalPlaylists,
              xp: totalXp,
            },
          };
        }
        return f;
      }),
    }));
  }, []);

  // ================= MEMBER OPERATIONS =================
  const selectMember = useCallback((id: string) => {
    setStore((prev) => {
      const currentFam = prev.families.find((f) => f.id === prev.activeFamilyId);
      const exists = currentFam?.members?.some((m) => m.id === id);
      if (exists) {
        return { ...prev, activeMemberId: id };
      }
      return prev;
    });
  }, []);

  const addMember = useCallback(
    (
      name: string,
      role: MemberRole,
      avatar: string,
      color: string,
      extra?: Partial<Member>
    ): Member => {
      const now = new Date().toISOString();
      const newMember: Member = {
        id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: name.trim() || 'Membro',
        role: role || 'Outro',
        avatar: avatar || '🎧',
        color: color || '#3a86ff',
        birthday: extra?.birthday || '',
        favoriteGenres: extra?.favoriteGenres || ['Pop'],
        favoriteArtists: extra?.favoriteArtists || [],
        favoritePlaylists: [],
        favoriteSongs: [],
        level: 1,
        xp: 100,
        streak: 1,
        badges: ['Boas-vindas'],
        statistics: {
          listenTime: 0,
          totalFavorites: 0,
          playlistsCreated: 0,
          tracksAdded: 0,
        },
        createdAt: now,
        ...extra,
      };

      setStore((prev) => ({
        ...prev,
        activeMemberId: newMember.id,
        families: prev.families.map((f) => {
          if (f.id === prev.activeFamilyId) {
            const updatedMembers = [...(f.members || []), newMember];
            return {
              ...f,
              members: updatedMembers,
              statistics: {
                ...f.statistics,
                totalMembers: updatedMembers.length,
              },
            };
          }
          return f;
        }),
      }));

      return newMember;
    },
    []
  );

  const updateMember = useCallback((id: string, data: Partial<Member>) => {
    setStore((prev) => ({
      ...prev,
      families: prev.families.map((f) => {
        if (f.id === prev.activeFamilyId) {
          const updatedMembers = (f.members || []).map((m) =>
            m.id === id ? { ...m, ...data } : m
          );
          return { ...f, members: updatedMembers };
        }
        return f;
      }),
    }));
  }, []);

  /**
   * Remove member with CASCADE:
   * 1. Remove member from family members array
   * 2. If removed member was active, switch activeMemberId
   * 3. Persist atomically to 'family_data'
   */
  const removeMember = useCallback((id: string) => {
    setStore((prev) => {
      const currentFam = prev.families.find((f) => f.id === prev.activeFamilyId);
      const famMembers = currentFam?.members || [];
      if (famMembers.length <= 1) {
        // Do not allow deleting the last remaining member
        return prev;
      }

      const filteredMembers = famMembers.filter((m) => m.id !== id);
      const nextActiveMemberId =
        prev.activeMemberId === id
          ? filteredMembers[0]?.id || 'p-1'
          : prev.activeMemberId;

      const newStore = {
        ...prev,
        activeMemberId: nextActiveMemberId,
        families: prev.families.map((f) => {
          if (f.id === prev.activeFamilyId) {
            return {
              ...f,
              members: filteredMembers,
              statistics: {
                ...f.statistics,
                totalMembers: filteredMembers.length,
              },
            };
          }
          return f;
        }),
      };
      return newStore;
    });
  }, []);

  const moveMember = useCallback((memberId: string, targetFamilyId: string) => {
    setStore((prev) => {
      // Find member in any family
      let targetMember: Member | null = null;
      prev.families.forEach((f) => {
        const found = f.members?.find((m) => m.id === memberId);
        if (found) targetMember = found;
      });

      if (!targetMember) return prev;

      return {
        ...prev,
        families: prev.families.map((f) => {
          if (f.id === targetFamilyId) {
            // Add member if not already there
            const exists = f.members?.some((m) => m.id === memberId);
            if (exists) return f;
            const updated = [...(f.members || []), targetMember!];
            return {
              ...f,
              members: updated,
              statistics: { ...f.statistics, totalMembers: updated.length },
            };
          } else {
            // Remove member from other families
            const filtered = (f.members || []).filter((m) => m.id !== memberId);
            return {
              ...f,
              members: filtered,
              statistics: { ...f.statistics, totalMembers: filtered.length },
            };
          }
        }),
      };
    });
  }, []);

  const addXp = useCallback((memberId: string, amount: number) => {
    setStore((prev) => ({
      ...prev,
      families: prev.families.map((f) => {
        if (f.id === prev.activeFamilyId) {
          const updatedMembers = (f.members || []).map((m) => {
            if (m.id === memberId) {
              const newXp = (m.xp || 0) + amount;
              const newLevel = Math.floor(newXp / 250) + 1;
              return { ...m, xp: newXp, level: newLevel };
            }
            return m;
          });
          const totalXp = updatedMembers.reduce((sum, m) => sum + (m.xp || 0), 0);
          return {
            ...f,
            members: updatedMembers,
            statistics: { ...f.statistics, xp: totalXp },
          };
        }
        return f;
      }),
    }));
  }, []);

  const incrementMemberListenTime = useCallback((memberId: string, minutes: number) => {
    setStore((prev) => ({
      ...prev,
      families: prev.families.map((f) => {
        if (f.id === prev.activeFamilyId) {
          const updatedMembers = (f.members || []).map((m) => {
            if (m.id === memberId) {
              const currentStats = m.statistics || {
                listenTime: 0,
                totalFavorites: 0,
                playlistsCreated: 0,
                tracksAdded: 0,
              };
              return {
                ...m,
                statistics: {
                  ...currentStats,
                  listenTime: (currentStats.listenTime || 0) + minutes,
                },
              };
            }
            return m;
          });
          const totalListenTime = updatedMembers.reduce(
            (sum, m) => sum + (m.statistics?.listenTime || m.listenTime || 0),
            0
          );
          return {
            ...f,
            members: updatedMembers,
            statistics: { ...f.statistics, totalListenTime },
          };
        }
        return f;
      }),
    }));
  }, []);

  const updateFamilyMembersInStore = useCallback((newMembers: Member[]) => {
    setStore((prev) => ({
      ...prev,
      families: prev.families.map((f) => {
        if (f.id === prev.activeFamilyId) {
          return {
            ...f,
            members: newMembers,
            statistics: { ...f.statistics, totalMembers: newMembers.length },
          };
        }
        return f;
      }),
    }));
  }, []);

  return (
    <FamilyContext.Provider
      value={{
        family: activeFamily,
        activeFamily,
        families: store.families,
        hasFamily,
        selectFamily,
        createFamily,
        updateFamily,
        deleteFamily,
        duplicateFamily,
        updateFamilySettings,
        regenerateInviteCode,
        recalculateFamilyStats,

        // Members (Single Source of Truth)
        members,
        activeMember,
        activeMemberId: store.activeMemberId,
        selectMember,
        addMember,
        updateMember,
        removeMember,
        moveMember,
        addXp,
        updateMemberXp: addXp,
        incrementMemberListenTime,
        updateFamilyMembersInStore,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
