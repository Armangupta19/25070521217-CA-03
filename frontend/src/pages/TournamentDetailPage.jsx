import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Shield,
  Clock,
  Layers,
  FileText,
  UserCheck,
  ChevronRight,
  PlusCircle,
  Settings,
  RefreshCw,
  Heart,
  Share2,
  Download,
  MessageSquare,
  Send,
  Trash2,
  X,
  Copy,
  Check,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { KnockoutBracket } from "../components/KnockoutBracket";
import { LeagueTable } from "../components/LeagueTable";
import { MatchCard } from "../components/MatchCard";
import { ScoreModal } from "../components/ScoreModal";
import { RegisterTeamModal } from "../components/RegisterTeamModal";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export function TournamentDetailPage() {
  const { id } = useParams();
  const { user, isAdmin, isCaptain, reloadUser } = useAuth();
  const socket = useSocket();

  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'fixtures' | 'teams' | 'rules' | 'discussion'
  
  // Comments
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // Modals & Popups
  const [selectedMatchForScore, setSelectedMatchForScore] = useState(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);

  const isFavourite = Boolean(
    user?.favourites?.some((f) => {
      const fId = f?._id ? f._id.toString() : f?.toString();
      return fId === id;
    })
  );

  const fetchTournamentData = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, mRes, sRes] = await Promise.all([
        api.tournaments.getById(id),
        api.matches.getAll({ tournament: id }),
        api.tournaments.getStandings(id).catch(() => ({})),
      ]);

      if (tRes.success) setTournament(tRes.tournament);
      if (mRes.success) setMatches(mRes.matches || []);
      if (sRes.success) {
        if (sRes.format === "league") setStandings(sRes.standings || []);
      }

      // Fetch comments for first match if any
      if (mRes.matches && mRes.matches.length > 0) {
        const cRes = await api.comments.getByMatch(mRes.matches[0]._id).catch(() => ({}));
        if (cRes.success) setComments(cRes.comments || []);
      }
    } catch (err) {
      console.error("Failed to fetch tournament details:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  // Real-time Socket.io integration
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("join:tournament", id);

    const handleScoreUpdated = (updatedMatch) => {
      toast.success(
        `Live Score Update: ${updatedMatch.teamA?.team?.name} vs ${updatedMatch.teamB?.team?.name}`
      );
      setMatches((prev) =>
        prev.map((m) => (m._id === updatedMatch._id ? updatedMatch : m))
      );
      // Refresh standings in background
      api.tournaments.getStandings(id).then((sRes) => {
        if (sRes.success && sRes.format === "league") {
          setStandings(sRes.standings || []);
        }
      }).catch(() => {});
    };

    const handleCommentNew = (comment) => {
      setComments((prev) => [...prev, comment]);
    };

    socket.on("score:updated", handleScoreUpdated);
    socket.on("comment:new", handleCommentNew);

    return () => {
      socket.emit("leave:tournament", id);
      socket.off("score:updated", handleScoreUpdated);
      socket.off("comment:new", handleCommentNew);
    };
  }, [socket, id]);

  // Favourite Toggle
  const handleToggleFavourite = async () => {
    if (!user) {
      toast.error("Please sign in to save favourites.");
      return;
    }
    try {
      setFavouriteLoading(true);
      const res = await api.tournaments.toggleFavourite(tournament._id);
      if (res.success) {
        toast.success(res.message);
        if (reloadUser) reloadUser();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update favourite");
    } finally {
      setFavouriteLoading(false);
    }
  };

  // Add Comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    if (!user) {
      toast.error("Please log in to post comments.");
      return;
    }

    const targetMatchId = matches[0]?._id;
    if (!targetMatchId) {
      toast.error("Comments can be posted once fixtures are generated.");
      return;
    }

    try {
      setCommentLoading(true);
      const res = await api.comments.add({
        match: targetMatchId,
        tournament: tournament._id,
        text: newCommentText.trim(),
      });
      if (res.success) {
        setComments((prev) => [...prev, res.comment]);
        setNewCommentText("");
        toast.success("Comment posted!");
      }
    } catch (err) {
      toast.error(err.message || "Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    try {
      await api.comments.delete(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete comment");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Tournament: ${tournament.name}\n`;
    csvContent += `Sport: ${tournament.sport}, Format: ${tournament.format}\n\n`;

    if (tournament.format === "league" && standings.length > 0) {
      csvContent += "Rank,Team,Played,Won,Drawn,Lost,GF,GA,GD,Points\n";
      standings.forEach((s) => {
        csvContent += `${s.rank},"${s.team?.name || ""}",${s.played},${s.won},${s.drawn},${s.lost},${s.goalsFor},${s.goalsAgainst},${s.goalDifference},${s.points}\n`;
      });
      csvContent += "\n";
    }

    csvContent += "Round,Match,Team A,Score A,Score B,Team B,Status,Winner\n";
    matches.forEach((m) => {
      csvContent += `"${m.roundName || m.round}",${m.matchNumber},"${m.teamA?.team?.name || "TBD"}",${m.teamA?.score ?? ""},${m.teamB?.score ?? ""},"${m.teamB?.team?.name || "TBD"}",${m.status},"${m.winner?.name || ""}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${tournament.name.replace(/\s+/g, "_")}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded!");
  };

  // Export PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(tournament.name, 14, 20);

      doc.setFontSize(11);
      doc.text(`Sport: ${tournament.sport} | Format: ${tournament.format} | Venue: ${tournament.venue}`, 14, 28);
      doc.text(`Dates: ${new Date(tournament.startDate).toLocaleDateString()} - ${new Date(tournament.endDate).toLocaleDateString()}`, 14, 34);

      let yPos = 46;

      if (tournament.format === "league" && standings.length > 0) {
        doc.setFontSize(14);
        doc.text("League Standings Table", 14, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.text("Pos   Team                      P    W    D    L    GD   Pts", 14, yPos);
        yPos += 6;

        standings.forEach((s) => {
          const name = (s.team?.name || "Team").padEnd(25).slice(0, 25);
          doc.text(`${String(s.rank).padEnd(5)}${name}${String(s.played).padEnd(5)}${String(s.won).padEnd(5)}${String(s.drawn).padEnd(5)}${String(s.lost).padEnd(5)}${String(s.goalDifference).padEnd(5)}${s.points}`, 14, yPos);
          yPos += 6;
        });

        yPos += 10;
      }

      doc.setFontSize(14);
      doc.text("Tournament Fixtures & Scores", 14, yPos);
      yPos += 8;

      doc.setFontSize(9);
      matches.forEach((m) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const teamA = m.teamA?.team?.name || "TBD";
        const teamB = m.teamB?.team?.name || "TBD";
        const score = m.status === "completed" ? `${m.teamA?.score} - ${m.teamB?.score}` : "vs";
        doc.text(`[${m.roundName || `R${m.round}`}] ${teamA} ${score} ${teamB} (${m.status.toUpperCase()})`, 14, yPos);
        yPos += 6;
      });

      doc.save(`${tournament.name.replace(/\s+/g, "_")}_overview.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to generate PDF document.");
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="card loading-skeleton" style={{ height: 260, marginBottom: 24 }} />
        <div className="card loading-skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="empty-state">
          <div className="empty-icon-box">
            <Trophy size={28} />
          </div>
          <div className="empty-title">Tournament Not Found</div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
            The requested tournament could not be located or may have been deleted.
          </p>
          <Link to="/tournaments" className="btn btn-primary">
            Return to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  const isKnockout = tournament.format === "knockout";
  const approvedTeams = (tournament.registeredTeams || []).filter((r) => r.status === "approved");
  const isRegistrationOpen = tournament.status === "registration_open";

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      {/* Tournament Header Banner */}
      <div
        style={{
          background: "linear-gradient(145deg, var(--bg-surface), var(--bg-card))",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          padding: 32,
          marginBottom: 32,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div style={{ maxWidth: 750 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <StatusBadge status={tournament.status} />
              <StatusBadge format={tournament.format} type="format" />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--primary)",
                  backgroundColor: "var(--primary-light)",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                }}
              >
                {tournament.sport}
              </span>
            </div>

            <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, marginBottom: 12, color: "var(--text-primary)" }}>
              {tournament.name}
            </h1>

            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
              {tournament.description || "Official tournament series."}
            </p>

            {/* Meta Grid */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontSize: 13, color: "var(--text-secondary)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={15} style={{ color: "var(--primary)" }} /> {tournament.venue}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={15} style={{ color: "var(--primary)" }} />
                {new Date(tournament.startDate).toLocaleDateString()} — {new Date(tournament.endDate).toLocaleDateString()}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={15} style={{ color: "var(--primary)" }} />
                {approvedTeams.length} / {tournament.maxTeams} Teams Approved
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={15} style={{ color: "var(--warning, #FBBF24)" }} />
                Reg Deadline: {new Date(tournament.registrationDeadline).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action Buttons Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 220 }}>
            {/* Quick Action row */}
            <div style={{ display: "flex", gap: 8 }}>
              {/* Favourite Button */}
              <button
                type="button"
                className={`btn btn-sm ${isFavourite ? "btn-primary" : "btn-outline"}`}
                onClick={handleToggleFavourite}
                disabled={favouriteLoading}
                title={isFavourite ? "Remove from favourites" : "Add to favourite tournaments"}
                style={{ flex: 1, justifyContent: "center" }}
              >
                <Heart size={15} fill={isFavourite ? "currentColor" : "none"} />
                {isFavourite ? "Saved" : "Favourite"}
              </button>

              {/* Share QR Button */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsShareModalOpen(true)}
                title="Share Tournament & QR Code"
                style={{ flex: 1, justifyContent: "center" }}
              >
                <Share2 size={15} /> Share
              </button>
            </div>

            {/* Export Dropdown / Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleExportPDF}
                title="Download PDF"
                style={{ flex: 1, justifyContent: "center", fontSize: "0.78rem" }}
              >
                <Download size={13} /> Export PDF
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleExportCSV}
                title="Download CSV"
                style={{ flex: 1, justifyContent: "center", fontSize: "0.78rem" }}
              >
                <Download size={13} /> Export CSV
              </button>
            </div>

            {/* Captain registration */}
            {isRegistrationOpen && (isCaptain || isAdmin) && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsRegisterModalOpen(true)}
              >
                <PlusCircle size={16} /> Register Team
              </button>
            )}

            {/* Admin Management Shortcuts */}
            {isAdmin && (
              <>
                <Link to={`/admin/tournaments/${tournament._id}/teams`} className="btn btn-secondary">
                  <UserCheck size={16} /> Review Teams ({tournament.registeredTeams?.length || 0})
                </Link>
                <Link to={`/admin/tournaments/${tournament._id}/fixtures`} className="btn btn-outline">
                  <Settings size={16} /> Manage Fixtures
                </Link>
              </>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchTournamentData}
              title="Refresh tournament data"
            >
              <RefreshCw size={13} /> Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: 28,
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          className={`btn ${activeTab === "overview" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("overview")}
          style={{ borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
        >
          <Trophy size={16} /> {isKnockout ? "Knockout Bracket" : "League Standings"}
        </button>

        <button
          type="button"
          className={`btn ${activeTab === "fixtures" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("fixtures")}
          style={{ borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
        >
          <Calendar size={16} /> Fixtures & Results ({matches.length})
        </button>

        <button
          type="button"
          className={`btn ${activeTab === "teams" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("teams")}
          style={{ borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
        >
          <Users size={16} /> Participating Teams ({tournament.registeredTeams?.length || 0})
        </button>

        <button
          type="button"
          className={`btn ${activeTab === "discussion" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("discussion")}
          style={{ borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
        >
          <MessageSquare size={16} /> Live Match Discussion ({comments.length})
        </button>

        <button
          type="button"
          className={`btn ${activeTab === "rules" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("rules")}
          style={{ borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
        >
          <FileText size={16} /> Rules & Info
        </button>
      </div>

      {/* Tab 1: Bracket or Standings */}
      {activeTab === "overview" && (
        <div>
          {isKnockout ? (
            <KnockoutBracket
              matches={matches}
              onOpenScoreModal={(m) => setSelectedMatchForScore(m)}
            />
          ) : (
            <LeagueTable standings={standings} tournamentId={tournament._id} />
          )}
        </div>
      )}

      {/* Tab 2: Fixtures & Results */}
      {activeTab === "fixtures" && (
        <div>
          {matches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-box">
                <Calendar size={28} />
              </div>
              <div className="empty-title">No Fixtures Generated Yet</div>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                Fixtures have not been drawn for this tournament yet.
              </p>
              {isAdmin && (
                <Link
                  to={`/admin/tournaments/${tournament._id}/fixtures`}
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                >
                  Generate Fixtures Now
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
              {matches.map((match) => (
                <MatchCard
                  key={match._id}
                  match={match}
                  onOpenScoreModal={(m) => setSelectedMatchForScore(m)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Participating Teams */}
      {activeTab === "teams" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {tournament.registeredTeams?.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              <div className="empty-icon-box">
                <Users size={28} />
              </div>
              <div className="empty-title">No Teams Registered Yet</div>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                Be the first team captain to register for this competition!
              </p>
            </div>
          ) : (
            tournament.registeredTeams.map((reg) => {
              const team = reg.team;
              if (!team) return null;

              return (
                <div key={reg._id} className="card card-elevated">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        className="team-color-dot"
                        style={{ backgroundColor: team.color || "var(--primary)", width: 14, height: 14 }}
                      />
                      <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
                        {team.name}
                      </span>
                    </div>
                    <StatusBadge status={reg.status} />
                  </div>

                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
                    {team.description || "Competitive sports team."}
                  </p>

                  <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: 10 }}>
                    <span>Captain: {team.captain?.name || "Captain"}</span>
                    <Link to={`/teams/${team._id}`} className="btn btn-outline btn-sm" style={{ padding: "3px 8px", fontSize: 11 }}>
                      Roster <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 4: Discussion & Match Comments */}
      {activeTab === "discussion" && (
        <div className="card" style={{ maxWidth: 760 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
            Tournament Match Discussion
          </h3>

          {/* New Comment Box */}
          <form onSubmit={handlePostComment} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                placeholder={user ? "Share match prediction or team cheer..." : "Log in to post a comment"}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                disabled={!user || commentLoading}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!user || commentLoading || !newCommentText.trim()}
              >
                <Send size={15} /> Post
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {comments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                No comments yet. Be the first to start the discussion!
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c._id}
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                        {c.user?.name || "Fan"}
                      </span>
                      {c.user?.role && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            background: "var(--primary-light)",
                            color: "var(--primary)",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {c.user.role}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                      {(user?._id === c.user?._id || isAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c._id)}
                          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                          title="Delete comment"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
                    {c.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Rules & Tournament Info */}
      {activeTab === "rules" && (
        <div className="card">
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
            Official Tournament Rules
          </h3>
          <div style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 28, whiteSpace: "pre-line" }}>
            {tournament.rules || "Standard competition rules apply."}
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
            Scoring Scheme & Regulations
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div className="card card-elevated">
              <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase" }}>Points per Win</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)" }}>
                {tournament.scoringConfig?.pointsPerWin ?? 3} Pts
              </div>
            </div>
            <div className="card card-elevated">
              <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase" }}>Points per Draw</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--accent-amber, #FBBF24)" }}>
                {tournament.scoringConfig?.pointsPerDraw ?? 1} Pts
              </div>
            </div>
            <div className="card card-elevated">
              <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase" }}>Points per Loss</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-muted)" }}>
                {tournament.scoringConfig?.pointsPerLoss ?? 0} Pts
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal with QR Code */}
      {isShareModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="card"
            style={{ maxWidth: 380, width: "100%", padding: 24, textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Share Tournament
              </h3>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 18 }}>
              Scan the QR code on a mobile device or copy the direct link.
            </p>

            {/* QR Code Container */}
            <div
              style={{
                background: "#FFFFFF",
                padding: 16,
                borderRadius: "12px",
                display: "inline-block",
                marginBottom: 20,
              }}
            >
              <QRCodeSVG
                value={window.location.href}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#0B1220"
                level="H"
              />
            </div>

            {/* URL Copy Input */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                readOnly
                value={window.location.href}
                style={{ fontSize: "0.82rem", padding: "8px 10px" }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Tournament link copied!");
                }}
              >
                <Copy size={14} /> Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Modal Hookup */}
      {selectedMatchForScore && (
        <ScoreModal
          match={selectedMatchForScore}
          onClose={() => setSelectedMatchForScore(null)}
          onSuccess={fetchTournamentData}
        />
      )}

      {/* Register Team Modal Hookup */}
      {isRegisterModalOpen && (
        <RegisterTeamModal
          tournament={tournament}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={fetchTournamentData}
        />
      )}
    </div>
  );
}
