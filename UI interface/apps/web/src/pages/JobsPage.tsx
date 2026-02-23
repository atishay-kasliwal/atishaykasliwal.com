import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import { getJobs, updateJob } from "../lib/api";

const LIMIT = 25;
const REFERRAL_OPTIONS = ["", "Yes", "No", "Pending", "Applied without referral"];

type SortField = "date_saved" | "company" | "role" | "referral_status" | "job_link";
type SortOrder = "asc" | "desc";

const SORT_CONFIG: { key: SortField; label: string }[] = [
  { key: "date_saved", label: "Date" },
  { key: "company", label: "Company" },
  { key: "role", label: "Role" },
  { key: "referral_status", label: "Referral" },
  { key: "job_link", label: "Link" },
];

function compareJobs(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  field: SortField,
  order: SortOrder
): number {
  const av = a[field];
  const bv = b[field];
  const empty = (v: unknown) => v == null || v === "";
  if (empty(av) && empty(bv)) return 0;
  if (empty(av)) return order === "asc" ? 1 : -1;
  if (empty(bv)) return order === "asc" ? -1 : 1;
  if (field === "date_saved") {
    const da = new Date(String(av)).getTime();
    const db = new Date(String(bv)).getTime();
    return order === "asc" ? da - db : db - da;
  }
  const sa = String(av).toLowerCase();
  const sb = String(bv).toLowerCase();
  const cmp = sa.localeCompare(sb);
  return order === "asc" ? cmp : -cmp;
}

export default function JobsPage() {
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);
  const [page, setPage] = useState(1);
  const [company, setCompany] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("date_saved");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [editForm, setEditForm] = useState({
    role: "",
    company: "",
    location_raw: "",
    job_link: "",
    referral_status: "",
    response_status: "",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      const res = await getJobs({
        page,
        limit: LIMIT,
        company: company || undefined,
        sort: sortBy,
        order: sortOrder,
      });
      setData(res.data ?? []);
    } catch (e) {
      setError((e as Error).message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, company, sortBy, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setCompany(searchInput.trim());
    setPage(1);
  }

  function handleSort(field: SortField) {
    if (field === sortBy) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder(field === "date_saved" ? "desc" : "asc"); // date: newest first; others: A→Z
    }
    setPage(1);
  }

  function openEdit(job: Record<string, unknown>) {
    setEditing(job);
    setEditForm({
      role: String(job.role ?? ""),
      company: String(job.company ?? ""),
      location_raw: String(job.location_raw ?? ""),
      job_link: String(job.job_link ?? ""),
      referral_status: String(job.referral_status ?? ""),
      response_status: String(job.response_status ?? ""),
      notes: String(job.notes ?? ""),
    });
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing?.id) return;
    try {
      setIsSaving(true);
      await updateJob(editing.id, {
        role: editForm.role.trim() || undefined,
        company: editForm.company.trim() || undefined,
        location_raw: editForm.location_raw.trim() || undefined,
        job_link: editForm.job_link.trim() || undefined,
        referral_status: editForm.referral_status.trim() || undefined,
        response_status: editForm.response_status.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
      });
      setEditing(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  const sortedData = useMemo(() => {
    if (!data.length) return data;
    return [...data].sort((a, b) => compareJobs(a, b, sortBy, sortOrder));
  }, [data, sortBy, sortOrder]);

  const hasNext = data.length === LIMIT;
  const hasPrev = page > 1;

  return (
    <>
      {error ? <div className="error">{error}</div> : null}

      <div className="card">
        <h2>Jobs</h2>
        <form className="form" onSubmit={onSearch} style={{ marginBottom: 16 }}>
          <input
            placeholder="Search by company"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        {isLoading ? (
          <Spinner />
        ) : data.length === 0 ? (
          <div className="empty-state">
            No jobs found. Add one from the Dashboard.
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {SORT_CONFIG.map(({ key, label }) => (
                      <th key={key}>
                        <button
                          type="button"
                          className="th-sort"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSort(key);
                          }}
                          title={sortBy === key ? `${sortOrder === "asc" ? "A→Z" : "Z→A"} (click to reverse)` : `Sort by ${label}`}
                        >
                          {label}
                          {sortBy === key ? (
                            <span className="th-sort-icon" aria-hidden>{sortOrder === "asc" ? " ↑" : " ↓"}</span>
                          ) : null}
                        </button>
                      </th>
                    ))}
                    <th aria-label="Actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((j) => (
                    <tr key={String(j.id)}>
                      <td>
                        {j.date_saved
                          ? new Date(String(j.date_saved)).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>{String(j.company ?? "-")}</td>
                      <td>{String(j.role ?? "-")}</td>
                      <td>{String(j.referral_status ?? "-")}</td>
                      <td>
                        {j.job_link ? (
                          <a
                            href={String(j.job_link)}
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
                        <button type="button" className="action-btn" onClick={() => openEdit(j)}>
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
            <h3>Edit Job</h3>
            <form className="form" onSubmit={onSaveEdit}>
              <input
                placeholder="Role *"
                value={editForm.role}
                onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
              />
              <input
                placeholder="Company *"
                value={editForm.company}
                onChange={(e) => setEditForm((p) => ({ ...p, company: e.target.value }))}
              />
              <input
                placeholder="Location"
                value={editForm.location_raw}
                onChange={(e) => setEditForm((p) => ({ ...p, location_raw: e.target.value }))}
              />
              <input
                placeholder="Job link (URL)"
                value={editForm.job_link}
                onChange={(e) => setEditForm((p) => ({ ...p, job_link: e.target.value }))}
              />
              <div className="form-row">
                <label className="form-label">Referral</label>
                <select
                  value={editForm.referral_status}
                  onChange={(e) => setEditForm((p) => ({ ...p, referral_status: e.target.value }))}
                  className="form-select"
                >
                  {REFERRAL_OPTIONS.map((opt) => (
                    <option key={opt || "empty"} value={opt}>{opt || "—"}</option>
                  ))}
                </select>
              </div>
              {editForm.referral_status === "Yes" && (
                <p className="referral-hint">
                  Ensure this company has an entry on the <Link to="/referrals" className="table-link">Referrals</Link> page.
                </p>
              )}
              <input
                placeholder="Response status"
                value={editForm.response_status}
                onChange={(e) => setEditForm((p) => ({ ...p, response_status: e.target.value }))}
              />
              <textarea
                placeholder="Notes"
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
              />
              <div className="modal-actions">
                <button type="button" className="action-btn" onClick={() => setEditing(null)} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || !editForm.role.trim() || !editForm.company.trim()}>
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
