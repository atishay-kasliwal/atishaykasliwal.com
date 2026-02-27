import { useState, useEffect } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  createJob,
  createReferral,
  createPending,
  createNote,
} from "../lib/api";
import { getLocalISODate } from "../lib/formatDate";

type LayoutProps = {
  userEmail: string;
  onLogout: () => void;
};

const emptyJobForm = {
  role: "Software Engineer",
  company: "",
  location_raw: "United States of America",
  job_link: "",
  referral_status: "No",
  notes: "",
  date_saved: getLocalISODate(),
};

const emptyPendingForm = {
  company: "",
  position_name: "",
  pending_date: getLocalISODate(),
  comment: "",
  link: "",
};

function getLocalISODatePlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return getLocalISODate(d);
}

const emptyNoteForm = {
  title: "",
  currentDate: getLocalISODate(),
  lastDate: getLocalISODatePlusDays(7),
  note: "",
};

export default function Layout({ userEmail, onLogout }: LayoutProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showPendingTask, setShowPendingTask] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [form, setForm] = useState(emptyJobForm);
  const [pendingForm, setPendingForm] = useState(emptyPendingForm);
  const [noteForm, setNoteForm] = useState(emptyNoteForm);

  useEffect(() => {
    if (!showQuickAdd && !showPendingTask && !showNoteModal) setModalError("");
  }, [showQuickAdd, showPendingTask, showNoteModal]);

  async function onCreateJob(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim()) return;
    if (form.referral_status === "Requested" || form.referral_status === "Pending") {
      if (!form.role.trim()) return;
      try {
        setIsSaving(true);
        setModalError("");
        await createReferral({
          company: form.company.trim(),
          request_log: form.role.trim(),
          request_date: form.date_saved || getLocalISODate(),
          request_link: form.job_link.trim() || undefined,
          referral_received: form.referral_status,
          comment: form.notes.trim() || undefined,
        });
        setForm({ ...emptyJobForm, date_saved: getLocalISODate() });
        setShowQuickAdd(false);
        window.dispatchEvent(new CustomEvent("dashboard-refresh"));
      } catch (err) {
        setModalError((err as Error).message);
      } finally {
        setIsSaving(false);
      }
      return;
    }
    if (!form.role.trim()) return;
    try {
      setIsSaving(true);
      setModalError("");
      await createJob({
        ...form,
        date_saved: form.date_saved || getLocalISODate(),
        job_link: form.job_link.trim() || undefined,
        referral_status: form.referral_status.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setForm({ ...emptyJobForm, date_saved: getLocalISODate() });
      setShowQuickAdd(false);
      window.dispatchEvent(new CustomEvent("dashboard-refresh"));
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  async function onCreatePending(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingForm.company.trim()) return;
    try {
      setIsSaving(true);
      setModalError("");
      await createPending({
        company: pendingForm.company.trim(),
        position_name: pendingForm.position_name.trim() || undefined,
        pending_date: pendingForm.pending_date || undefined,
        comment: pendingForm.comment.trim() || undefined,
        link: pendingForm.link.trim() || undefined,
      });
      setPendingForm({
        ...emptyPendingForm,
        pending_date: getLocalISODate(),
      });
      setShowPendingTask(false);
      window.dispatchEvent(new CustomEvent("dashboard-refresh"));
      window.dispatchEvent(new CustomEvent("pending-refresh"));
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  async function onCreateNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteForm.title.trim() && !noteForm.note.trim()) return;
    try {
      setIsSaving(true);
      setModalError("");
      const lines: string[] = [];
      if (noteForm.title.trim()) {
        lines.push(noteForm.title.trim());
      }
      if (noteForm.lastDate.trim()) {
        lines.push(`Last date: ${noteForm.lastDate.trim()}`);
      }
      if (noteForm.note.trim()) {
        lines.push("");
        lines.push(noteForm.note.trim());
      }
      await createNote({
        note_date: noteForm.currentDate || getLocalISODate(),
        comments: lines.join("\n"),
      });
      setNoteForm({
        ...emptyNoteForm,
        currentDate: getLocalISODate(),
        lastDate: getLocalISODatePlusDays(7),
      });
      setShowNoteModal(false);
      window.dispatchEvent(new CustomEvent("dashboard-refresh"));
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="page">
      <nav className="app-nav">
        <div className="app-nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}>
            Dashboard
          </NavLink>
          <NavLink to="/jobs" className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}>
            Active Jobs
          </NavLink>
          <NavLink to="/referrals" className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}>
            Referrals
          </NavLink>
          <NavLink to="/archive" className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}>
            Archive
          </NavLink>
          <NavLink to="/pending" className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}>
            Pending
          </NavLink>
          <NavLink to="/notes" className={({ isActive }) => (isActive ? "app-nav-link active" : "app-nav-link")}>
            Notes
          </NavLink>
        </div>
        <div className="app-nav-actions">
          <button type="button" className="quick-add-btn" onClick={() => setShowQuickAdd(true)}>
            + Add Job
          </button>
          <button type="button" className="quick-add-btn pending-task-btn" onClick={() => setShowPendingTask(true)}>
            Add Task
          </button>
          <button type="button" className="quick-add-btn pending-task-btn" onClick={() => setShowNoteModal(true)}>
            Add Note
          </button>
          <button type="button" className="quick-add-btn logout-btn" onClick={onLogout} title="Logout" aria-label="Logout">
            <span className="logout-emoji">⏻</span>
          </button>
        </div>
      </nav>
      <main className="page-main">
        <Outlet />
      </main>

      {showQuickAdd && (
        <div className="modal-overlay" onClick={() => !isSaving && setShowQuickAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Job</h3>
            {modalError ? <div className="auth-error">{modalError}</div> : null}
            <form className="form" onSubmit={onCreateJob}>
              <input
                placeholder="Position *"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              />
              <input
                placeholder="Company *"
                value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
              />
              <div className="form-row">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={form.date_saved}
                  onChange={(e) => setForm((p) => ({ ...p, date_saved: e.target.value }))}
                />
              </div>
              <input
                placeholder="Location"
                value={form.location_raw}
                onChange={(e) => setForm((p) => ({ ...p, location_raw: e.target.value }))}
              />
              <input
                placeholder="Job link (URL)"
                type="url"
                value={form.job_link}
                onChange={(e) => setForm((p) => ({ ...p, job_link: e.target.value }))}
              />
              <div className="form-row">
                <label className="form-label">Referral</label>
                <select
                  value={form.referral_status}
                  onChange={(e) => setForm((p) => ({ ...p, referral_status: e.target.value }))}
                  className="form-select"
                >
                  <option value="">—</option>
                  <option value="Requested">Requested</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Pending">Pending</option>
                  <option value="Applied without referral">Applied without referral</option>
                </select>
              </div>
              {(form.referral_status === "Requested" || form.referral_status === "Pending") && (
                <p className="referral-hint">
                  This will add an entry on the <Link to="/referrals" className="table-link">Referrals</Link> page. Change its status there to create a job.
                </p>
              )}
              {form.referral_status === "Yes" && (
                <p className="referral-hint">
                  Add a referral for this company on the <Link to="/referrals" className="table-link">Referrals</Link> page to keep track.
                </p>
              )}
              <textarea
                placeholder="Notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
              <div className="modal-actions">
                <button type="button" className="action-btn" onClick={() => !isSaving && setShowQuickAdd(false)} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || !form.company.trim() || !form.role.trim()}>
                  {isSaving ? "Saving..." : "Add Job"}
                </button>
              </div>
            </form>
            <p style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              View and search all jobs on the <Link to="/jobs" className="table-link">Jobs</Link> page.
            </p>
          </div>
        </div>
      )}

      {showPendingTask && (
        <div className="modal-overlay" onClick={() => !isSaving && setShowPendingTask(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Task</h3>
            {modalError ? <div className="auth-error">{modalError}</div> : null}
            <form className="form" onSubmit={onCreatePending}>
              <input
                placeholder="Company *"
                value={pendingForm.company}
                onChange={(e) => setPendingForm((p) => ({ ...p, company: e.target.value }))}
              />
              <input
                placeholder="Position"
                value={pendingForm.position_name}
                onChange={(e) => setPendingForm((p) => ({ ...p, position_name: e.target.value }))}
              />
              <input
                type="date"
                placeholder="Date"
                value={pendingForm.pending_date}
                onChange={(e) => setPendingForm((p) => ({ ...p, pending_date: e.target.value }))}
              />
              <input
                placeholder="Comment"
                value={pendingForm.comment}
                onChange={(e) => setPendingForm((p) => ({ ...p, comment: e.target.value }))}
              />
              <input
                placeholder="Link (URL)"
                type="url"
                value={pendingForm.link}
                onChange={(e) => setPendingForm((p) => ({ ...p, link: e.target.value }))}
              />
              <div className="modal-actions">
                <button type="button" className="action-btn" onClick={() => !isSaving && setShowPendingTask(false)} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || !pendingForm.company.trim()}>
                  {isSaving ? "Saving..." : "Add Pending"}
                </button>
              </div>
            </form>
            <p style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              View all on the <Link to="/pending" className="table-link">Pending</Link> tab.
            </p>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="modal-overlay" onClick={() => !isSaving && setShowNoteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Note</h3>
            {modalError ? <div className="auth-error">{modalError}</div> : null}
            <form className="form" onSubmit={onCreateNote}>
              <input
                placeholder="Title *"
                value={noteForm.title}
                onChange={(e) => setNoteForm((p) => ({ ...p, title: e.target.value }))}
              />
              <div className="form-row">
                <label className="form-label">Current date</label>
                <input
                  type="date"
                  value={noteForm.currentDate}
                  onChange={(e) => setNoteForm((p) => ({ ...p, currentDate: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <label className="form-label">Last date</label>
                <input
                  type="date"
                  value={noteForm.lastDate}
                  onChange={(e) => setNoteForm((p) => ({ ...p, lastDate: e.target.value }))}
                />
              </div>
              <textarea
                placeholder="Note"
                rows={4}
                value={noteForm.note}
                onChange={(e) => setNoteForm((p) => ({ ...p, note: e.target.value }))}
              />
              <div className="modal-actions">
                <button type="button" className="action-btn" onClick={() => !isSaving && setShowNoteModal(false)} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || !noteForm.title.trim()}>
                  {isSaving ? "Saving..." : "Add Note"}
                </button>
              </div>
            </form>
            <p style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              View and manage all notes on the{" "}
              <Link to="/notes" className="table-link">
                Notes
              </Link>{" "}
              tab.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
