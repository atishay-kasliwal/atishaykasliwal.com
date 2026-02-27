import { useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import { formatTableDate } from "../lib/formatDate";
import { createPending, getPending, getDashboardSummary, markPendingDone } from "../lib/api";

export default function PendingPage() {
    const [editId, setEditId] = useState<number | string | null>(null);
    const [editForm, setEditForm] = useState<any | null>(null);
    const [editLoading, setEditLoading] = useState(false);

    function startEdit(item: any) {
      setEditId(item.id);
      setEditForm({
        company: item.company ?? "",
        position_name: item.position_name ?? "",
        pending_date: item.pending_date ? String(item.pending_date).slice(0, 10) : "",
        comment: item.comment ?? "",
        link: item.link ?? "",
      });
    }

    function cancelEdit() {
      setEditId(null);
      setEditForm(null);
    }

    async function saveEdit(id: number | string) {
      setEditLoading(true);
      try {
        await editPending(id, editForm);
        await load();
        cancelEdit();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setEditLoading(false);
      }
    }
  const [pendingData, setPendingData] = useState<Array<Record<string, unknown>>>([]);
  const [archiveData, setArchiveData] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [markingId, setMarkingId] = useState<number | string | null>(null);
  const [showPendingTask, setShowPendingTask] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingForm, setPendingForm] = useState({
    company: "",
    position_name: "",
    pending_date: new Date().toISOString().slice(0, 10),
    comment: "",
    link: "",
  });

  async function load() {
    try {
      setError("");
      setIsLoading(true);
      const [pendingRes, archiveRes] = await Promise.all([
        getPending(),
        getPending(true),
      ]);
      setPendingData(pendingRes.data ?? []);
      setArchiveData(archiveRes.data ?? []);
    } catch (e) {
      setError((e as Error).message);
      setPendingData([]);
      setArchiveData([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onRefresh = () => load();
    window.addEventListener("pending-refresh", onRefresh);
    return () => window.removeEventListener("pending-refresh", onRefresh);
  }, []);

  useEffect(() => {
    const onRefresh = () => load();
    window.addEventListener("dashboard-refresh", onRefresh);
    return () => window.removeEventListener("dashboard-refresh", onRefresh);
  }, []);

  async function onMarkDone(id: number | string) {
    try {
      setMarkingId(id);
      await markPendingDone(id);
      await load();
      await getDashboardSummary();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMarkingId(null);
    }
  }

  async function onCreatePending(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingForm.company.trim()) return;
    try {
      setIsSaving(true);
      await createPending({
        company: pendingForm.company.trim(),
        position_name: pendingForm.position_name.trim() || undefined,
        pending_date: pendingForm.pending_date || undefined,
        comment: pendingForm.comment.trim() || undefined,
        link: pendingForm.link.trim() || undefined,
      });
      setPendingForm({
        company: "",
        position_name: "",
        pending_date: new Date().toISOString().slice(0, 10),
        comment: "",
        link: "",
      });
      setShowPendingTask(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {error ? <div className="error">{error}</div> : null}

      <div className="card">
        <h2>Pending Items</h2>
        {isLoading ? (
          <Spinner />
        ) : pendingData.length === 0 ? (
          <div className="empty-state">No pending items. All clear.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Comment</th>
                  <th>Link</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pendingData.map((p) => (
                  <tr key={String(p.id)} className="tr-hover">
                    {editId === p.id ? (
                      <>
                        <td><input type="date" value={editForm.pending_date} onChange={e => setEditForm((f: any) => ({ ...f, pending_date: e.target.value }))} /></td>
                        <td><input value={editForm.company} onChange={e => setEditForm((f: any) => ({ ...f, company: e.target.value }))} /></td>
                        <td><input value={editForm.position_name} onChange={e => setEditForm((f: any) => ({ ...f, position_name: e.target.value }))} /></td>
                        <td><input value={editForm.comment} onChange={e => setEditForm((f: any) => ({ ...f, comment: e.target.value }))} /></td>
                        <td><input value={editForm.link} onChange={e => setEditForm((f: any) => ({ ...f, link: e.target.value }))} /></td>
                        <td colSpan={2}>
                          <button className="action-btn" disabled={editLoading} onClick={() => saveEdit(p.id)}>Save</button>
                          <button className="action-btn" disabled={editLoading} onClick={cancelEdit}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{formatTableDate(p.pending_date)}</td>
                        <td>{String(p.company ?? "-")}</td>
                        <td>{String(p.position_name ?? "-")}</td>
                        <td>{String(p.comment ?? "-")}</td>
                        <td>
                          {p.link ? (
                            <a
                              href={String(p.link)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="table-link"
                            >
                              Open
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="action-btn"
                            disabled={markingId === p.id}
                            onClick={() => onMarkDone(p.id as number)}
                          >
                            {markingId === p.id ? "..." : "Mark done"}
                          </button>
                        </td>
                        <td>
                          <button className="action-btn" onClick={() => startEdit(p)}>Edit</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 32 }}>
        <h2>Archive</h2>
        {isLoading ? (
          <Spinner />
        ) : archiveData.length === 0 ? (
          <div className="empty-state">No archived items.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Comment</th>
                  <th>Link</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {archiveData.map((p) => (
                  <tr key={String(p.id)} className="tr-hover archived">
                    {editId === p.id ? (
                      <>
                        <td><input type="date" value={editForm.pending_date} onChange={e => setEditForm((f: any) => ({ ...f, pending_date: e.target.value }))} /></td>
                        <td><input value={editForm.company} onChange={e => setEditForm((f: any) => ({ ...f, company: e.target.value }))} /></td>
                        <td><input value={editForm.position_name} onChange={e => setEditForm((f: any) => ({ ...f, position_name: e.target.value }))} /></td>
                        <td><input value={editForm.comment} onChange={e => setEditForm((f: any) => ({ ...f, comment: e.target.value }))} /></td>
                        <td><input value={editForm.link} onChange={e => setEditForm((f: any) => ({ ...f, link: e.target.value }))} /></td>
                        <td>
                          <button className="action-btn" disabled={editLoading} onClick={() => saveEdit(p.id)}>Save</button>
                          <button className="action-btn" disabled={editLoading} onClick={cancelEdit}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{formatTableDate(p.pending_date)}</td>
                        <td>{String(p.company ?? "-")}</td>
                        <td>{String(p.position_name ?? "-")}</td>
                        <td>{String(p.comment ?? "-")}</td>
                        <td>
                          {p.link ? (
                            <a
                              href={String(p.link)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="table-link"
                            >
                              Open
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          <button className="action-btn" onClick={() => startEdit(p)}>Edit</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPendingTask && (
        <div className="modal-overlay" onClick={() => !isSaving && setShowPendingTask(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Task</h3>
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
              Pending items appear in the list above.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
