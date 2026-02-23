import { useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import { formatTableDate } from "../lib/formatDate";
import { createPending, getPending, getDashboardSummary, markPendingDone } from "../lib/api";

export default function PendingPage() {
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);
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
      const res = await getPending();
      setData(res.data ?? []);
    } catch (e) {
      setError((e as Error).message);
      setData([]);
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
        ) : data.length === 0 ? (
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
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={String(p.id)} className="tr-hover">
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
