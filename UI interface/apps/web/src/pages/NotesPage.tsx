import { useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import { deleteNote, getNotes, updateNote } from "../lib/api";
import { formatTableDate } from "../lib/formatDate";

export default function NotesPage() {
  const [activeNotes, setActiveNotes] = useState<Array<Record<string, any>>>([]);
  const [archiveNotes, setArchiveNotes] = useState<Array<Record<string, any>>>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [editForm, setEditForm] = useState<{ note_date: string; comments: string }>({
    note_date: "",
    comments: "",
  });

  async function load() {
    try {
      setError("");
      setIsLoading(true);
      const [activeRes, archiveRes] = await Promise.all([
        getNotes({ page: 1, limit: 100, archive: false }),
        getNotes({ page: 1, limit: 100, archive: true }),
      ]);
      setActiveNotes(activeRes.data ?? []);
      setArchiveNotes(archiveRes.data ?? []);
    } catch (e) {
      setError((e as Error).message);
      setActiveNotes([]);
      setArchiveNotes([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(note: Record<string, any>) {
    setEditId(note.id);
    setEditForm({
      note_date: String(note.note_date ?? ""),
      comments: String(note.comments ?? ""),
    });
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({ note_date: "", comments: "" });
  }

  async function saveEdit(id: number | string) {
    try {
      setIsSaving(true);
      await updateNote(id, {
        note_date: editForm.note_date || undefined,
        comments: editForm.comments || undefined,
      });
      await load();
      cancelEdit();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  async function markDone(id: number | string) {
    try {
      setIsSaving(true);
      await updateNote(id, { is_done: true });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number | string) {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    try {
      setIsSaving(true);
      await deleteNote(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {error ? <div className="error">{error}</div> : null}

      <section>
        {/* Active notes table */}
        <div className="card">
          <h2>Notes</h2>
          {isLoading ? (
            <Spinner />
          ) : activeNotes.length === 0 ? (
            <div className="empty-state">No active notes.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeNotes.map((n) => {
                    const full = String(n.comments ?? "");
                    const [titleLine, ...restLines] = full.split("\n");
                    const title = titleLine || "";
                    const noteBody = restLines.join(" ").trim();
                    return (
                      <tr key={String(n.id)} className="tr-hover">
                        {editId === n.id ? (
                          <>
                            <td>
                              <input
                                type="date"
                                value={editForm.note_date}
                                onChange={(e) =>
                                  setEditForm((p) => ({ ...p, note_date: e.target.value }))
                                }
                              />
                            </td>
                            <td colSpan={2}>
                              <textarea
                                rows={3}
                                value={editForm.comments}
                                onChange={(e) =>
                                  setEditForm((p) => ({ ...p, comments: e.target.value }))
                                }
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="action-btn"
                                onClick={cancelEdit}
                                disabled={isSaving}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="action-btn"
                                onClick={() => saveEdit(n.id)}
                                disabled={isSaving}
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{formatTableDate(n.note_date)}</td>
                            <td>{title || "-"}</td>
                            <td>{noteBody || "-"}</td>
                            <td>
                              <button
                                type="button"
                                className="action-btn"
                                onClick={() => startEdit(n)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="action-btn"
                                onClick={() => markDone(n.id)}
                              >
                                Archive
                              </button>
                              <button
                                type="button"
                                className="action-btn"
                                onClick={() => handleDelete(n.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Archive notes table */}
        <div className="card" style={{ marginTop: 32 }}>
          <h2>Archive</h2>
          {isLoading ? (
            <Spinner />
          ) : archiveNotes.length === 0 ? (
            <div className="empty-state">No archived notes.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archiveNotes.map((n) => {
                    const full = String(n.comments ?? "");
                    const [titleLine, ...restLines] = full.split("\n");
                    const title = titleLine || "";
                    const noteBody = restLines.join(" ").trim();
                    return (
                      <tr key={String(n.id)} className="tr-hover archived">
                        {editId === n.id ? (
                          <>
                            <td>
                              <input
                                type="date"
                                value={editForm.note_date}
                                onChange={(e) =>
                                  setEditForm((p) => ({ ...p, note_date: e.target.value }))
                                }
                              />
                            </td>
                            <td colSpan={2}>
                              <textarea
                                rows={3}
                                value={editForm.comments}
                                onChange={(e) =>
                                  setEditForm((p) => ({ ...p, comments: e.target.value }))
                                }
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="action-btn"
                                onClick={cancelEdit}
                                disabled={isSaving}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="action-btn"
                                onClick={() => saveEdit(n.id)}
                                disabled={isSaving}
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{formatTableDate(n.note_date)}</td>
                            <td>{title || "-"}</td>
                            <td>{noteBody || "-"}</td>
                            <td>
                              <button
                                type="button"
                                className="action-btn"
                                onClick={() => startEdit(n)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="action-btn"
                                onClick={() => handleDelete(n.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
