import { useCallback, useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import { createNote, getNotes } from "../lib/api";

const LIMIT = 25;

export default function NotesPage() {
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ note_date: "", comments: "" });

  const load = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);
      const res = await getNotes({ page, limit: LIMIT });
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.comments.trim()) return;
    try {
      setIsSaving(true);
      await createNote({
        note_date: form.note_date.trim() || undefined,
        comments: form.comments.trim(),
      });
      setForm({ note_date: "", comments: "" });
      const res = await getNotes({ page: 1, limit: LIMIT });
      setData(res.data ?? []);
      setPage(1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  const hasNext = data.length === LIMIT;
  const hasPrev = page > 1;

  return (
    <>
      {error ? <div className="error">{error}</div> : null}

      <section className="layout-2">
        <div className="card">
          <h2>Add Note</h2>
          <form className="form" onSubmit={onSubmit}>
            <input
              placeholder="Date (optional, e.g. YYYY-MM-DD)"
              value={form.note_date}
              onChange={(e) => setForm((p) => ({ ...p, note_date: e.target.value }))}
            />
            <textarea
              placeholder="Comments *"
              rows={4}
              value={form.comments}
              onChange={(e) => setForm((p) => ({ ...p, comments: e.target.value }))}
            />
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Add Note"}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Notes</h2>
          {isLoading ? (
            <Spinner />
          ) : data.length === 0 ? (
            <div className="empty-state">No notes yet. Add one from the form.</div>
          ) : (
            <>
              <ul className="notes">
                {data.map((n) => (
                  <li key={String(n.id)}>
                    <strong>{String(n.note_date ?? "No date")}:</strong> {String(n.comments ?? "")}
                  </li>
                ))}
              </ul>
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
      </section>
    </>
  );
}
