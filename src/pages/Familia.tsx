import React, { useState } from 'react';
import {
  useFamily,
  useMember,
  usePlaylist,
} from '../hooks';
import {
  FamilyHeader,
  FamilyCard,
  MemberCard,
  AvatarSelector,
  ColorSelector,
  Modal,
  Button,
  Input,
  SectionTitle,
  EmptyState,
} from '../components';
import { Member, MemberRole, Family } from '../types';
import {
  Users,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  ArrowRightLeft,
  CopyPlus,
  Edit3,
  HeartHandshake,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ICON_MAP } from '../components/AvatarSelector';

export const Familia: React.FC = () => {
  const {
    family,
    families,
    selectFamily,
    createFamily,
    updateFamily,
    deleteFamily,
    duplicateFamily,
    moveMember,
  } = useFamily();

  const {
    members,
    activeMember,
    addMember,
    updateMember,
    removeMember,
  } = useMember();

  // Role Filter
  const [roleFilter, setRoleFilter] = useState<string>('todos');

  // Modal States
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [isCreateFamilyModalOpen, setIsCreateFamilyModalOpen] = useState(false);
  const [isEditFamilyModalOpen, setIsEditFamilyModalOpen] = useState(false);
  const [isManageFamiliesModalOpen, setIsManageFamiliesModalOpen] = useState(false);

  // Move Member Modal State
  const [movingMember, setMovingMember] = useState<Member | null>(null);
  const [targetFamilyId, setTargetFamilyId] = useState<string>('');

  // Confirmation Delete Modals
  const [deletingFamily, setDeletingFamily] = useState<Family | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  // Form States - Member
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState<MemberRole>('Filho');
  const [memberAvatar, setMemberAvatar] = useState('🎧');
  const [memberColor, setMemberColor] = useState('#8338ec');
  const [memberBirthday, setMemberBirthday] = useState('');
  const [memberGenresInput, setMemberGenresInput] = useState('');

  // Form States - Family
  const [familyName, setFamilyName] = useState('');
  const [familyPhoto, setFamilyPhoto] = useState('🏠');
  const [familyColor, setFamilyColor] = useState('#8338ec');
  const [familySecondaryColor, setFamilySecondaryColor] = useState('#ff006e');
  const [familyDescription, setFamilyDescription] = useState('');

  // ---------------- Handlers for Member ----------------
  const handleOpenAddMember = () => {
    setMemberName('');
    setMemberRole('Filho');
    setMemberAvatar('🎧');
    setMemberColor('#8338ec');
    setMemberBirthday('');
    setMemberGenresInput('');
    setIsAddMemberModalOpen(true);
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) {
      toast.error('Preencha o nome do membro!');
      return;
    }

    const genres = memberGenresInput
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    addMember(memberName.trim(), memberRole, memberAvatar, memberColor, {
      birthday: memberBirthday,
      favoriteGenres: genres.length > 0 ? genres : ['Pop'],
    });

    toast.success(`${memberName} foi adicionado(a) à família! 🎉`);
    setIsAddMemberModalOpen(false);
  };

  const handleOpenEditMember = (member: Member) => {
    setEditingMember(member);
    setMemberName(member.name);
    setMemberRole(member.role);
    setMemberAvatar(member.avatar);
    setMemberColor(member.color);
    setMemberBirthday(member.birthday || '');
    setMemberGenresInput((member.favoriteGenres || []).join(', '));
    setIsEditMemberModalOpen(true);
  };

  const handleEditMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !memberName.trim()) return;

    const genres = memberGenresInput
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    updateMember(editingMember.id, {
      name: memberName.trim(),
      role: memberRole,
      avatar: memberAvatar,
      color: memberColor,
      birthday: memberBirthday,
      favoriteGenres: genres,
    });

    toast.success(`Dados de ${memberName} atualizados com sucesso!`);
    setIsEditMemberModalOpen(false);
    setEditingMember(null);
  };

  const handleConfirmDeleteMember = () => {
    if (!deletingMember) return;
    if (members.length <= 1) {
      toast.error('A família precisa ter pelo menos 1 membro!');
      setDeletingMember(null);
      return;
    }
    removeMember(deletingMember.id);
    toast.success(`Membro ${deletingMember.name} foi removido.`);
    setDeletingMember(null);
  };

  // Move member handler
  const handleOpenMoveMember = (member: Member) => {
    setMovingMember(member);
    const otherFam = families.find((f) => f.id !== family.id);
    setTargetFamilyId(otherFam?.id || '');
  };

  const handleMoveMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingMember || !targetFamilyId) {
      toast.error('Selecione a família de destino!');
      return;
    }

    moveMember(movingMember.id, targetFamilyId);
    const targetFam = families.find((f) => f.id === targetFamilyId);
    toast.success(`${movingMember.name} foi movido(a) para "${targetFam?.name || 'outra família'}"!`);
    setMovingMember(null);
  };

  // ---------------- Handlers for Family ----------------
  const handleOpenCreateFamily = () => {
    setFamilyName('');
    setFamilyPhoto('🏠');
    setFamilyColor('#8338ec');
    setFamilySecondaryColor('#ff006e');
    setFamilyDescription('');
    setIsCreateFamilyModalOpen(true);
  };

  const handleCreateFamilySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) {
      toast.error('Preencha o nome da família!');
      return;
    }

    const newFam = createFamily(
      familyName.trim(),
      familyPhoto,
      familyColor,
      familyDescription
    );

    toast.success(`Família "${newFam.name}" criada com sucesso! 🎉`);
    setIsCreateFamilyModalOpen(false);
  };

  const handleOpenEditFamily = () => {
    setFamilyName(family.name || family.familyName || '');
    setFamilyPhoto(family.photo || '🏠');
    setFamilyColor(family.color || '#8338ec');
    setFamilySecondaryColor('#ff006e');
    setFamilyDescription(family.description || '');
    setIsEditFamilyModalOpen(true);
  };

  const handleEditFamilySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) {
      toast.error('O nome da família não pode estar vazio!');
      return;
    }

    updateFamily(family.id, {
      name: familyName.trim(),
      photo: familyPhoto,
      color: familyColor,
      description: familyDescription,
    });

    toast.success('Família atualizada com sucesso!');
    setIsEditFamilyModalOpen(false);
  };

  const handleDuplicateFamily = (famId?: string) => {
    const idToDuplicate = famId || family.id;
    const duplicated = duplicateFamily(idToDuplicate);
    toast.success(`Família duplicada com sucesso: "${duplicated.name}"!`);
  };

  const handleConfirmDeleteFamily = () => {
    if (!deletingFamily) return;
    deleteFamily(deletingFamily.id);
    toast.success(`Família "${deletingFamily.name}" foi excluída.`);
    setDeletingFamily(null);
  };

  // Roles available
  const ROLES: MemberRole[] = ['Pai', 'Mãe', 'Filho', 'Filha', 'Outro'];

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    if (roleFilter === 'todos') return true;
    return m.role.toLowerCase() === roleFilter.toLowerCase();
  });

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-300">
      {/* 1. Header principal */}
      <FamilyHeader
        family={family}
        activeMember={activeMember}
        onAddMember={handleOpenAddMember}
        onCreateFamily={handleOpenCreateFamily}
      />

      {families.length === 0 ? (
        <EmptyState
          title="Nenhuma família cadastrada"
          description="Sua conta do NeonFlow começa do zero. Crie a primeira família da casa e adicione os membros para compartilhar suas playlists."
          actionLabel="Criar Primeira Família"
          onActionClick={handleOpenCreateFamily}
        />
      ) : (
        <>
          {/* 2. Family Main Card & Quick Family Selector */}
          <div className="flex flex-col gap-4">
            <FamilyCard
              family={family}
              onEditFamily={handleOpenEditFamily}
              onDuplicateFamily={() => handleDuplicateFamily(family.id)}
              onDeleteFamily={() => setDeletingFamily(family)}
              onAddMember={handleOpenAddMember}
              onSwitchFamily={() => setIsManageFamiliesModalOpen(true)}
            />
          </div>

      {/* 3. Section Title & Member Role Filter Badges */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-brand-border/60 pb-4">
        <SectionTitle
          title={`Membros da Família (${members.length})`}
          subtitle="Gerencie perfis, funções, avatares e estatísticas musicais de cada membro."
        />

        {/* Member Role Chips */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
          {['todos', 'Pai', 'Mãe', 'Filho', 'Filha', 'Outro'].map((role) => {
            const isSelected = roleFilter === role.toLowerCase();
            return (
              <button
                key={role}
                onClick={() => setRoleFilter(role.toLowerCase())}
                className={`px-3.5 py-1.5 rounded-full text-2xs font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20 scale-105'
                    : 'bg-white/5 text-brand-text-muted hover:text-white hover:bg-white/10'
                }`}
              >
                {role === 'todos' ? 'Todos os Membros' : role}
              </button>
            );
          })}

          <Button onClick={handleOpenAddMember} variant="glass" size="sm">
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </Button>
        </div>
      </div>

      {/* 4. Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={handleOpenOpenEdit => handleOpenEditMember(member)}
              onRemove={() => setDeletingMember(member)}
              onMove={families.length > 1 ? () => handleOpenMoveMember(member) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-brand-surface/40 border border-brand-border text-center flex flex-col items-center justify-center gap-3">
          <Users className="w-12 h-12 text-brand-text-muted animate-bounce" />
          <h3 className="text-lg font-bold text-white">Nenhum membro encontrado</h3>
          <p className="text-xs text-brand-text-muted max-w-md">
            Não há membros com o filtro "{roleFilter}". Adicione um novo membro para expandir sua família!
          </p>
          <Button onClick={handleOpenAddMember} variant="primary" size="sm">
            <Plus className="w-4 h-4" /> Adicionar Membro
          </Button>
        </div>
      )}
    </>
  )}

      {/* ================= MODAL: ADD MEMBER ================= */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Criar Novo Membro da Família"
        size="md"
      >
        <form onSubmit={handleAddMemberSubmit} className="flex flex-col gap-5">
          <Input
            label="Nome do Membro"
            placeholder="Ex: Lucas, Sofia, Ana..."
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            required
          />

          {/* Role Choice Pills */}
          <div className="flex flex-col gap-2">
            <label className="text-2xs font-extrabold uppercase tracking-wider text-brand-text-muted">
              Papel na Família
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const isSelected = memberRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setMemberRole(r)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20 scale-105 border border-brand-purple-light'
                        : 'bg-black/40 border border-brand-border/60 text-brand-text-muted hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avatar Selector (Emoji / Lucide Icon / URL) */}
          <AvatarSelector
            selectedAvatar={memberAvatar}
            onSelectAvatar={(avatar) => setMemberAvatar(avatar)}
          />

          {/* Color Selector (Circles + Custom Hex) */}
          <ColorSelector
            selectedColor={memberColor}
            onSelectColor={(color) => setMemberColor(color)}
            label="Cor do Card do Membro"
          />

          <Input
            label="Data de Nascimento (Opcional)"
            type="date"
            value={memberBirthday}
            onChange={(e) => setMemberBirthday(e.target.value)}
          />

          <Input
            label="Gêneros Musicais Favoritos (Separados por vírgula)"
            placeholder="Ex: Pop, Rock, Sertanejo, Eletrônica"
            value={memberGenresInput}
            onChange={(e) => setMemberGenresInput(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border/60">
            <Button
              type="button"
              variant="glass"
              onClick={() => setIsAddMemberModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" glow>
              Criar Membro
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: EDIT MEMBER ================= */}
      <Modal
        isOpen={isEditMemberModalOpen}
        onClose={() => setIsEditMemberModalOpen(false)}
        title={`Editar Membro: ${editingMember?.name || ''}`}
        size="md"
      >
        <form onSubmit={handleEditMemberSubmit} className="flex flex-col gap-5">
          <Input
            label="Nome do Membro"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            required
          />

          <div className="flex flex-col gap-2">
            <label className="text-2xs font-extrabold uppercase tracking-wider text-brand-text-muted">
              Papel na Família
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const isSelected = memberRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setMemberRole(r)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20 scale-105 border border-brand-purple-light'
                        : 'bg-black/40 border border-brand-border/60 text-brand-text-muted hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          <AvatarSelector
            selectedAvatar={memberAvatar}
            onSelectAvatar={(avatar) => setMemberAvatar(avatar)}
          />

          <ColorSelector
            selectedColor={memberColor}
            onSelectColor={(color) => setMemberColor(color)}
            label="Cor do Card do Membro"
          />

          <Input
            label="Data de Nascimento"
            type="date"
            value={memberBirthday}
            onChange={(e) => setMemberBirthday(e.target.value)}
          />

          <Input
            label="Gêneros Favoritos"
            value={memberGenresInput}
            onChange={(e) => setMemberGenresInput(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border/60">
            <Button
              type="button"
              variant="glass"
              onClick={() => setIsEditMemberModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: CREATE FAMILY WITH REAL-TIME BANNER PREVIEW ================= */}
      <Modal
        isOpen={isCreateFamilyModalOpen}
        onClose={() => setIsCreateFamilyModalOpen(false)}
        title="Criar Nova Família"
        size="lg"
      >
        <form onSubmit={handleCreateFamilySubmit} className="flex flex-col gap-6">
          {/* Banner Real-time Preview Box */}
          <div className="flex flex-col gap-2">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-brand-purple-light flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" /> Preview em Tempo Real do Banner
            </span>
            <div
              className="p-6 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden transition-all duration-300 flex items-center gap-4"
              style={{
                background: `linear-gradient(135deg, ${familyColor}40 0%, ${familySecondaryColor}30 100%)`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-xl border shrink-0 overflow-hidden"
                style={{
                  backgroundColor: `${familyColor}30`,
                  borderColor: familyColor,
                }}
              >
                {familyPhoto.startsWith('http') ? (
                  <img src={familyPhoto} alt="Preview" className="w-full h-full object-cover" />
                ) : familyPhoto.startsWith('icon:') ? (
                  (() => {
                    const name = familyPhoto.replace('icon:', '');
                    const IconComponent = ICON_MAP[name] || HeartHandshake;
                    return <IconComponent className="w-8 h-8" style={{ color: familyColor }} />;
                  })()
                ) : (
                  familyPhoto || '🏠'
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-3xs font-extrabold uppercase text-brand-cyan tracking-widest">
                  Nova Estrutura Familiar
                </span>
                <h3 className="text-xl font-black text-white truncate">
                  {familyName || 'Nome da Família'}
                </h3>
                <p className="text-xs text-brand-text-muted truncate mt-0.5">
                  {familyDescription || 'Sua descrição personalizada aparecerá aqui.'}
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Nome da Família"
            placeholder="Ex: Família Silva, Neon Crew, Os Rockeiros..."
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            required
          />

          <Input
            label="Descrição da Família"
            placeholder="Ex: Apaixonados por música e playlists compartilhadas"
            value={familyDescription}
            onChange={(e) => setFamilyDescription(e.target.value)}
          />

          <AvatarSelector
            selectedAvatar={familyPhoto}
            onSelectAvatar={(photo) => setFamilyPhoto(photo)}
          />

          <ColorSelector
            selectedColor={familyColor}
            onSelectColor={(color) => setFamilyColor(color)}
            label="Cor Principal do Tema"
          />

          <ColorSelector
            selectedColor={familySecondaryColor}
            onSelectColor={(color) => setFamilySecondaryColor(color)}
            label="Cor Secundária do Banner (Gradiente)"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border/60">
            <Button
              type="button"
              variant="glass"
              onClick={() => setIsCreateFamilyModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" glow>
              Criar Família
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: EDIT FAMILY WITH REAL-TIME BANNER PREVIEW ================= */}
      <Modal
        isOpen={isEditFamilyModalOpen}
        onClose={() => setIsEditFamilyModalOpen(false)}
        title="Editar Família"
        size="lg"
      >
        <form onSubmit={handleEditFamilySubmit} className="flex flex-col gap-6">
          {/* Banner Real-time Preview Box */}
          <div className="flex flex-col gap-2">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-brand-purple-light flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" /> Preview em Tempo Real do Banner
            </span>
            <div
              className="p-6 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden transition-all duration-300 flex items-center gap-4"
              style={{
                background: `linear-gradient(135deg, ${familyColor}40 0%, ${familySecondaryColor}30 100%)`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-xl border shrink-0 overflow-hidden"
                style={{
                  backgroundColor: `${familyColor}30`,
                  borderColor: familyColor,
                }}
              >
                {familyPhoto.startsWith('http') ? (
                  <img src={familyPhoto} alt="Preview" className="w-full h-full object-cover" />
                ) : familyPhoto.startsWith('icon:') ? (
                  (() => {
                    const name = familyPhoto.replace('icon:', '');
                    const IconComponent = ICON_MAP[name] || HeartHandshake;
                    return <IconComponent className="w-8 h-8" style={{ color: familyColor }} />;
                  })()
                ) : (
                  familyPhoto || '🏠'
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-3xs font-extrabold uppercase text-brand-cyan tracking-widest">
                  Banner da Família
                </span>
                <h3 className="text-xl font-black text-white truncate">
                  {familyName || 'Nome da Família'}
                </h3>
                <p className="text-xs text-brand-text-muted truncate mt-0.5">
                  {familyDescription || 'Sua descrição aparecerá aqui.'}
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Nome da Família"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            required
          />

          <Input
            label="Descrição da Família"
            value={familyDescription}
            onChange={(e) => setFamilyDescription(e.target.value)}
          />

          <AvatarSelector
            selectedAvatar={familyPhoto}
            onSelectAvatar={(photo) => setFamilyPhoto(photo)}
          />

          <ColorSelector
            selectedColor={familyColor}
            onSelectColor={(color) => setFamilyColor(color)}
            label="Cor Principal do Tema"
          />

          <ColorSelector
            selectedColor={familySecondaryColor}
            onSelectColor={(color) => setFamilySecondaryColor(color)}
            label="Cor Secundária do Banner (Gradiente)"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border/60">
            <Button
              type="button"
              variant="glass"
              onClick={() => setIsEditFamilyModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Família
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: MOVE MEMBER ================= */}
      <Modal
        isOpen={!!movingMember}
        onClose={() => setMovingMember(null)}
        title={`Mover Membro: ${movingMember?.name || ''}`}
        size="md"
      >
        <form onSubmit={handleMoveMemberSubmit} className="flex flex-col gap-5">
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Selecione para qual família deseja transferir o membro <strong>{movingMember?.name}</strong>:
          </p>

          <div className="flex flex-col gap-2">
            {families
              .filter((f) => f.id !== family.id)
              .map((fam) => {
                const isSelected = targetFamilyId === fam.id;
                return (
                  <button
                    key={fam.id}
                    type="button"
                    onClick={() => setTargetFamilyId(fam.id)}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-purple/20 border-brand-purple text-white shadow-lg'
                        : 'bg-black/40 border-brand-border/60 text-brand-text-muted hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${fam.color || '#8338ec'}30` }}
                      >
                        {fam.photo || '🏠'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white">{fam.name}</span>
                        <span className="text-3xs text-brand-text-muted">
                          {fam.members?.length || 0} membros cadastrados
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-brand-cyan" />}
                  </button>
                );
              })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border/60">
            <Button
              type="button"
              variant="glass"
              onClick={() => setMovingMember(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" glow>
              Confirmar Mover
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: MANAGE & SWITCH FAMILIES ================= */}
      <Modal
        isOpen={isManageFamiliesModalOpen}
        onClose={() => setIsManageFamiliesModalOpen(false)}
        title="Gerenciar Famílias NeonFlow"
        size="lg"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
            <span className="text-xs text-brand-text-muted">
              Você possui <strong>{families.length}</strong> família(s) cadastrada(s).
            </span>
            <Button onClick={handleOpenCreateFamily} variant="primary" size="sm">
              <Plus className="w-3.5 h-3.5" /> Criar Família
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-1">
            {families.map((fam) => {
              const isActiveFam = fam.id === family.id;
              return (
                <div
                  key={fam.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                    isActiveFam
                      ? 'bg-brand-purple/20 border-brand-purple text-white shadow-xl ring-1 ring-brand-purple/50'
                      : 'bg-black/40 border-brand-border/60 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow border shrink-0"
                      style={{
                        backgroundColor: `${fam.color || '#8338ec'}20`,
                        borderColor: `${fam.color || '#8338ec'}80`,
                      }}
                    >
                      {fam.photo || '🏠'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="font-extrabold text-sm text-white truncate">
                        {fam.name}
                      </h4>
                      <span className="text-3xs text-brand-text-muted">
                        {fam.members?.length || 0} Membros • Código: {fam.inviteCode}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isActiveFam ? (
                      <Button
                        onClick={() => {
                          selectFamily(fam.id);
                          toast.success(`Família ativa alterada para "${fam.name}"`);
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        Ativar
                      </Button>
                    ) : (
                      <span className="text-3xs font-extrabold text-brand-cyan uppercase px-2.5 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/30">
                        Ativa Agora
                      </span>
                    )}

                    <button
                      onClick={() => handleDuplicateFamily(fam.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-text-muted hover:text-white transition-colors"
                      title="Duplicar esta Família"
                    >
                      <CopyPlus className="w-4 h-4" />
                    </button>

                    {families.length > 1 && (
                      <button
                        onClick={() => setDeletingFamily(fam)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-brand-text-muted hover:text-rose-400 transition-colors"
                        title="Excluir Família"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* ================= MODAL CONFIRMAÇÃO EMANANTE: EXCLUIR FAMÍLIA ================= */}
      <Modal
        isOpen={!!deletingFamily}
        onClose={() => setDeletingFamily(null)}
        title="Excluir Família"
        size="sm"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-base font-extrabold text-white">
              Excluir "{deletingFamily?.name}"?
            </h3>
            <p className="text-xs text-brand-text-muted leading-relaxed">
              Esta ação excluirá permanentemente esta família, todos os seus membros associados e estatísticas.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 w-full pt-2">
            <Button
              type="button"
              variant="glass"
              className="w-1/2"
              onClick={() => setDeletingFamily(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              className="w-1/2"
              onClick={handleConfirmDeleteFamily}
            >
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL CONFIRMAÇÃO EMANANTE: EXCLUIR MEMBRO ================= */}
      <Modal
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        title="Remover Membro"
        size="sm"
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-base font-extrabold text-white">
              Remover {deletingMember?.name}?
            </h3>
            <p className="text-xs text-brand-text-muted leading-relaxed">
              O perfil do membro será removido da família <strong>{family.name}</strong>.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 w-full pt-2">
            <Button
              type="button"
              variant="glass"
              className="w-1/2"
              onClick={() => setDeletingMember(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              className="w-1/2"
              onClick={handleConfirmDeleteMember}
            >
              Sim, Remover
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
