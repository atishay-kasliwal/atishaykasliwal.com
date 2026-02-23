import { useCallback, useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import { formatTableDate } from "../lib/formatDate";
import { createJob, getReferrals, updateReferral } from "../lib/api";

const LIMIT = 25;
const REFERRAL_SHEET_STATUSES = ["Requested", "Pending"] as const;
const JOB_STATUSES = ["Yes", "No", "Applied without referral"] as const;
const ALL_STATUS_OPTIONS = [...REFERRAL_SHEET_STATUSES, ...JOB_STATUSES] as const;

export default function ReferralsPage() {
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editReferredByName, setEditReferredByName] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      const res = await getReferrals({ page, limit: LIMIT, filter: "open" });
      setData(res.data ?? []);
    } catch (e) {
      setError((e as Error).message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(r: Record<string, unknown>) {
    setEditing(r);
    setEditStatus(String(r.referral_received ?? ""));
    setEditReferredByName(String(r.referred_by_name ?? ""));
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing?.id) return;
    const newStatus = editStatus.trim();
    try {
      setIsSaving(true);
      await updateReferral(String(editing.id), {
        referral_received: newStatus || null,
        referred_by_name: editReferredByName.trim() || null,
      });
      const movesToJobs = JOB_STATUSES.includes(newStatus as (typeof JOB_STATUSES)[number]);
      if (movesToJobs) {
        let jobLink: string | undefined;
        try {
          const link = (editing.request_link as string)?.trim();
          if (link && new URL(link).href) jobLink = link;
        } catch {
          /* omit invalid URL */
        }
        await createJob({
          company: String(editing.company ?? "").trim(),
          role: (editing.request_log as string)?.trim() || "(From referral)",
          job_link: jobLink,
          referral_status: newStatus,
          notes: (editing.comment as string)?.trim() || undefined,
        });
      }
      setEditing(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  const hasNext = data.length === LIMIT;
  const hasPrev = page > 1;
  const movesToJobs = JOB_STATUSES.includes(editStatus as (typeof JOB_STATUSES)[number]);

  return (
    <>
      {error ? <div className="error">{error}</div> : null}

      <div className="card">
        <h2>Referrals</h2>
        {isLoading ? (
          <Spinner />
        ) : data.length === 0 ? (
          <div className="empty-state">No referrals with status Requested or Pending.</div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Company</th>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Referred by</th>
                    <th>Link</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={String(r.id)} className="tr-hover">
                      <td>{formatTableDate(r.request_date)}</td>
                      <td>{String(r.company ?? "—")}</td>
                      <td>{String(r.request_log ?? "—")}</td>
                      <td>{String(r.referral_received ?? "—")}</td>
                      <td>{String(r.referred_by_name ?? "—")}</td>
                      <td>
                        {r.request_link ? (
                          <a href={String(r.request_link)} target="_blank" rel="noopener noreferrer" className="table-link">
                            Open
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <button type="button" className="action-btn" onClick={() => openEdit(r)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button type="button" disabled={!hasPrev} onClick={() => setPage((p) => p - 1)}>
                Prev
              </button>
              <span>Page {page}</span>
              <button type="button" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => !isSaving && setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Referral</h3>
            <p style={{ margin: "0 0 12px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              {String(editing.company)} — {String(editing.request_log || "—")}
            </p>
            <form className="form" onSubmit={onSaveEdit}>
              <div className="form-row">
                <label className="form-label">Referred by name</label>
                <input
                  type="text"
                  placeholder="Name of person who referred you"
                  value={editReferredByName}
                  onChange={(e) => setEditReferredByName(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label className="form-label">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="form-select">
                  {ALL_STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {movesToJobs && (
                <p className="referral-hint">
                  Saving as &quot;{editStatus}&quot; will create a job and remove this row from the referral sheet.
                </p>
              )}
              <div className="modal-actions">
                <button type="button" className="action-btn" onClick={() => !isSaving && setEditing(null)} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
