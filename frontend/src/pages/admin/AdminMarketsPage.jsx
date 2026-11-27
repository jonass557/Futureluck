import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trophy, Users, Sparkles, CheckCircle2, X, UserPlus, Award, Eye, Pencil, Trash2, Lock } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { formatFCFA, formatDateFR } from '@/lib/utils';
import api from '@/lib/api';

export default function AdminMarketsPage() {
  const [markets, setMarkets] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  // Create / Edit form state
  const [editingMarketId, setEditingMarketId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('Investissez et tentez votre chance. Transformez votre participation en argent !');
  const [marketDate, setMarketDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startHour, setStartHour] = useState('00:00');
  const [endHour, setEndHour] = useState('23:59');
  const [winnersCount, setWinnersCount] = useState('2');
  const [productPrice, setProductPrice] = useState('5000');
  const [prizeAmount, setPrizeAmount] = useState('25000');
  const [status, setStatus] = useState('open');
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Participants & Winner Selection modal
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [winnerIds, setWinnerIds] = useState([]);
  const [settling, setSettling] = useState(false);

  // Admin Add Participant state
  const [addPartUserId, setAddPartUserId] = useState('');
  const [addPartName, setAddPartName] = useState('');
  const [addPartPhone, setAddPartPhone] = useState('');
  const [addPartStake, setAddPartStake] = useState('5000');
  const [addingPart, setAddingPart] = useState(false);

  // Admin Direct Add Winner state
  const [directWinUserId, setDirectWinUserId] = useState('');
  const [directWinPrize, setDirectWinPrize] = useState('25000');
  const [addingWin, setAddingWin] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.get('/markets?status=all'), api.get('/admin/users')])
      .then(([mRes, uRes]) => {
        setMarkets(mRes.data.markets || []);
        setAllUsers(uRes.data.users || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingMarketId(null);
    setTitle('');
    setDescription('Investissez et tentez votre chance. Transformez votre participation en argent !');
    setMarketDate(new Date().toISOString().slice(0, 10));
    setStartHour('00:00');
    setEndHour('23:59');
    setWinnersCount('2');
    setProductPrice('5000');
    setPrizeAmount('25000');
    setStatus('open');
    setImageFile(null);
  };

  const startEdit = (m) => {
    setEditingMarketId(m._id);
    setTitle(m.title);
    setDescription(m.description || '');
    setMarketDate(m.marketDate ? new Date(m.marketDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    const sDate = new Date(m.startTime);
    const eDate = new Date(m.endTime);
    setStartHour(`${String(sDate.getUTCHours()).padStart(2, '0')}:${String(sDate.getUTCMinutes()).padStart(2, '0')}`);
    setEndHour(`${String(eDate.getUTCHours()).padStart(2, '0')}:${String(eDate.getUTCMinutes()).padStart(2, '0')}`);
    setWinnersCount(String(m.winnersCount || 2));
    setProductPrice(String(m.productPrice || m.minStake || 5000));
    setPrizeAmount(String(m.prizeAmount || 25000));
    setStatus(m.status || 'open');
    setImageFile(null);
    setShowCreate(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Supprimer le produit "${m.title}" ?`)) return;
    try {
      const { data } = await api.delete(`/admin/markets/${m._id}`);
      setFeedback(data.message);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const handleCloseMarket = async (m) => {
    if (!window.confirm(`Clôturer le marché "${m.title}" maintenant ?`)) return;
    try {
      await api.patch(`/admin/markets/${m._id}`, { status: 'closed' });
      setFeedback(`Le marché "${m.title}" a été clôturé.`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la clôture.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('marketDate', `${marketDate}T00:00:00Z`);
      fd.append('startTime', `${marketDate}T${startHour}:00Z`);
      fd.append('endTime', `${marketDate}T${endHour}:00Z`);
      fd.append('winnersCount', winnersCount);
      fd.append('productPrice', productPrice);
      fd.append('prizeAmount', prizeAmount);
      fd.append('minStake', productPrice);
      fd.append('status', status);
      if (imageFile) fd.append('image', imageFile);

      if (editingMarketId) {
        await api.patch(`/admin/markets/${editingMarketId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFeedback('Produit mis à jour avec succès !');
      } else {
        await api.post('/admin/markets', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFeedback('Marché publié avec succès !');
      }
      setShowCreate(false);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l’enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const openParticipants = async (market) => {
    setSelectedMarket(market);
    setWinnerIds([]);
    setAddPartStake(String(market.productPrice || market.minStake || 5000));
    setDirectWinPrize(String(market.prizeAmount || 25000));
    const { data } = await api.get(`/admin/markets/${market._id}/participants`);
    setParticipants(data.participations || []);
  };

  const toggleWinner = (id) => {
    setWinnerIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSettle = async (autoDraw = false) => {
    if (!selectedMarket) return;
    setSettling(true);
    try {
      const { data } = await api.post(`/admin/markets/${selectedMarket._id}/settle`, {
        winnerParticipationIds: winnerIds,
        autoDraw,
      });
      setFeedback(data.message);
      setSelectedMarket(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la clôture.');
    } finally {
      setSettling(false);
    }
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!selectedMarket) return;
    setAddingPart(true);
    try {
      const payload = addPartUserId
        ? { userId: addPartUserId, stakeAmount: Number(addPartStake) }
        : { fullName: addPartName, phone: addPartPhone, stakeAmount: Number(addPartStake) };

      const { data } = await api.post(`/admin/markets/${selectedMarket._id}/participants`, payload);
      setFeedback(data.message);
      setAddPartUserId('');
      setAddPartName('');
      setAddPartPhone('');
      await openParticipants(selectedMarket);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l’ajout du participant.');
    } finally {
      setAddingPart(false);
    }
  };

  const handleAddWinner = async ({ participationId = null, userId = null, prize }) => {
    if (!selectedMarket) return;
    setAddingWin(true);
    try {
      const { data } = await api.post(`/admin/markets/${selectedMarket._id}/winners`, {
        participationId,
        userId,
        prizeAmount: Number(prize),
      });
      setFeedback(data.message);
      setDirectWinUserId('');
      await openParticipants(selectedMarket);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l’ajout du gagnant.');
    } finally {
      setAddingWin(false);
    }
  };

  return (
    <AdminLayout title="Gestion des Marchés, Participants & Gagnants">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 font-medium">
            Créez des produits (prix du produit & prix à gagner), ajoutez des participants et désignez les gagnants.
          </p>
          <Button
            variant="gold"
            onClick={() => {
              if (showCreate && editingMarketId) {
                resetForm();
              } else {
                resetForm();
                setShowCreate((v) => !v);
              }
            }}
          >
            <Plus className="w-4 h-4" /> Créer un produit / marché
          </Button>
        </div>

        {feedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" /> {feedback}
          </div>
        )}

        {/* Create Market Form */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-3xl p-6 fl-card-shadow border border-blue-100 space-y-4"
          >
            <h2 className="text-lg font-extrabold text-[#001B6B]">
              {editingMarketId ? 'Modifier le Produit / Marché' : 'Nouveau Produit / Marché Virtuel'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom du produit *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Coffret cadeau intelligent"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Image du produit (Cloudinary)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prix du produit (FCFA) *</label>
                <input
                  type="number"
                  min={100}
                  required
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prix à gagner (FCFA) *</label>
                <input
                  type="number"
                  min={100}
                  required
                  value={prizeAmount}
                  onChange={(e) => setPrizeAmount(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 font-bold text-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date du marché *</label>
                <input
                  type="date"
                  required
                  value={marketDate}
                  onChange={(e) => setMarketDate(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ouverture *</label>
                  <input
                    type="time"
                    required
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clôture *</label>
                  <input
                    type="time"
                    required
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de gagnants *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={winnersCount}
                  onChange={(e) => setWinnersCount(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Enregistrement...' : editingMarketId ? 'Enregistrer les modifications' : 'Publier le produit'}
              </Button>
            </div>
          </form>
        )}

        {/* Markets List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-500">Chargement...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {markets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((m) => (
              <div key={m._id} className="bg-white rounded-2xl p-5 fl-card-shadow border border-slate-100 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={m.imageUrl} alt={m.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div>
                      <h3 className="font-extrabold text-[#001B6B]">{m.title}</h3>
                      <p className="text-xs text-slate-500">{formatDateFR(m.marketDate)}</p>
                    </div>
                  </div>
                  <Badge variant={m.status === 'open' ? 'open' : m.status === 'settled' ? 'settled' : 'closed'}>
                    {m.status === 'open' ? 'Ouvert' : m.status === 'settled' ? 'Réglé' : m.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#EEF4FF] rounded-xl p-3 text-center text-xs">
                  <div>
                    <p className="text-slate-500">Prix produit</p>
                    <p className="font-black text-[#001B6B]">{formatFCFA(m.productPrice || m.minStake)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Prix à gagner</p>
                    <p className="font-black text-emerald-700">{formatFCFA(m.prizeAmount || 25000)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Participants</p>
                    <p className="font-black text-[#0033B3]">{m.participantsCount}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" className="flex-1" onClick={() => openParticipants(m)}>
                    <Users className="w-4 h-4" />
                    Participants & Gagnants
                  </Button>
                  <Link
                    to={`/markets/${m._id}`}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                    title="Voir le produit"
                  >
                    <Eye className="w-3.5 h-3.5" /> Voir
                  </Link>
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full bg-[#EEF4FF] hover:bg-blue-100 text-[#0033B3] text-xs font-bold cursor-pointer"
                    title="Modifier"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Modifier
                  </button>
                  {m.status === 'open' && (
                    <button
                      type="button"
                      onClick={() => handleCloseMarket(m)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold cursor-pointer"
                      title="Clôturer le marché"
                    >
                      <Lock className="w-3.5 h-3.5" /> Clôturer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(m)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </div>
              </div>
            ))}
            </div>
            <Pagination
              page={page}
              totalPages={Math.max(1, Math.ceil(markets.length / PAGE_SIZE))}
              onPageChange={setPage}
            />
          </>
        )}

        {/* Participants & Winner Management Modal */}
        {selectedMarket && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="fl-gradient-blue text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-lg">{selectedMarket.title}</h3>
                  <p className="text-xs text-blue-100">
                    Prix produit : {formatFCFA(selectedMarket.productPrice || selectedMarket.minStake)} • Prix à gagner :{' '}
                    <strong className="text-[#FFD200]">{formatFCFA(selectedMarket.prizeAmount || 25000)}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMarket(null)}
                  className="p-1.5 rounded-full hover:bg-white/15 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-5">
                {/* 1. Admin Add Participant Form */}
                <form
                  onSubmit={handleAddParticipant}
                  className="bg-[#EEF4FF] rounded-2xl p-4 space-y-3 border border-blue-200"
                >
                  <h4 className="font-extrabold text-sm text-[#001B6B] flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#0033B3]" />
                    Ajouter un participant à ce produit
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <select
                      value={addPartUserId}
                      onChange={(e) => setAddPartUserId(e.target.value)}
                      className="min-h-[42px] px-3 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    >
                      <option value="">-- Choisir utilisateur existant --</option>
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.phone})
                        </option>
                      ))}
                    </select>
                    {!addPartUserId && (
                      <>
                        <input
                          type="text"
                          placeholder="Nom complet"
                          value={addPartName}
                          onChange={(e) => setAddPartName(e.target.value)}
                          className="min-h-[42px] px-3 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                        <input
                          type="tel"
                          placeholder="Téléphone (+237...)"
                          value={addPartPhone}
                          onChange={(e) => setAddPartPhone(e.target.value)}
                          className="min-h-[42px] px-3 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                      </>
                    )}
                    <input
                      type="number"
                      min={100}
                      value={addPartStake}
                      onChange={(e) => setAddPartStake(e.target.value)}
                      placeholder="Mise (FCFA)"
                      className="min-h-[42px] px-3 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="sm" disabled={addingPart}>
                    {addingPart ? 'Ajout...' : '+ Ajouter ce participant'}
                  </Button>
                </form>

                {/* 2. Admin Direct Add Winner Form */}
                <div className="bg-amber-50 rounded-2xl p-4 space-y-3 border border-amber-200">
                  <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    Ajouter directement un gagnant (crédite son compte pour retrait)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <select
                      value={directWinUserId}
                      onChange={(e) => setDirectWinUserId(e.target.value)}
                      className="min-h-[42px] px-3 rounded-xl border border-amber-300 bg-white text-xs font-bold"
                    >
                      <option value="">-- Sélectionner un utilisateur --</option>
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.phone})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={100}
                      value={directWinPrize}
                      onChange={(e) => setDirectWinPrize(e.target.value)}
                      placeholder="Prix gagné (FCFA)"
                      className="min-h-[42px] px-3 rounded-xl border border-amber-300 bg-white text-xs font-bold"
                    />
                    <Button
                      variant="gold"
                      size="sm"
                      disabled={addingWin || !directWinUserId}
                      onClick={() => handleAddWinner({ userId: directWinUserId, prize: directWinPrize })}
                    >
                      <Trophy className="w-4 h-4" /> Ajouter & Créditer
                    </Button>
                  </div>
                </div>

                {/* 3. Participants List */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-[#001B6B]">
                    Participants inscrits ({participants.length})
                  </h4>
                  {participants.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">Aucun participant pour ce marché.</p>
                  ) : (
                    participants.map((p) => (
                      <div
                        key={p._id}
                        className={`flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl border ${
                          winnerIds.includes(p._id) || p.status === 'won'
                            ? 'border-amber-400 bg-amber-50'
                            : 'border-slate-200'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer">
                          {selectedMarket.status !== 'settled' && p.status !== 'won' && (
                            <input
                              type="checkbox"
                              checked={winnerIds.includes(p._id)}
                              onChange={() => toggleWinner(p._id)}
                              className="w-5 h-5 accent-[#0033B3]"
                            />
                          )}
                          <div>
                            <p className="font-bold text-sm text-slate-900">{p.user?.fullName}</p>
                            <p className="text-xs text-slate-500">
                              {p.user?.phone} • Mise : {formatFCFA(p.stakeAmount)}
                            </p>
                          </div>
                        </label>

                        <div className="flex items-center gap-2">
                          {p.status === 'won' ? (
                            <Badge variant="gold">
                              Gagnant #{p.rank} ({formatFCFA(p.actualGain)})
                            </Badge>
                          ) : (
                            <button
                              type="button"
                              disabled={addingWin}
                              onClick={() =>
                                handleAddWinner({
                                  participationId: p._id,
                                  prize: selectedMarket.prizeAmount || p.potentialGain,
                                })
                              }
                              className="px-3 py-1.5 rounded-full bg-[#FFD200] hover:brightness-95 text-[#001B6B] text-xs font-extrabold cursor-pointer"
                            >
                              + Désigner gagnant
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {selectedMarket.status !== 'settled' && (
                <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
                  <Button variant="gold" size="sm" disabled={settling} onClick={() => handleSettle(true)}>
                    <Sparkles className="w-4 h-4" /> Tirage aléatoire ({selectedMarket.winnersCount})
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={settling || (participants.length > 0 && winnerIds.length === 0)}
                    onClick={() => handleSettle(false)}
                  >
                    <Trophy className="w-4 h-4" /> Valider sélection ({winnerIds.length}) & Clôturer
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
