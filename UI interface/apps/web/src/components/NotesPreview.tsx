import { useEffect, useState } from "react";
import { getNotes } from "../lib/api";
import Spinner from "./Spinner";

export default function NotesPreview() {
  const [rows, setRows] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        setLoading(true);
        const res = await getNotes({ page: 1, limit: 8, archive: false });
        setRows(res.data ?? []);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ paddingTop: 8 }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      {error ? <div className="error">{error}</div> : null}
      {rows.length === 0 ? (
        <div className="chart-empty">No notes yet.</div>
      ) : (
        <ul className="pending-list">
          {rows.map((n) => {
            const comments = String(n.comments ?? "");
            const [firstLine, ...rest] = comments.split("\n");
            const subtitle = rest.join(" ").slice(0, 140);
            return (
              <li key={String(n.id)} className="pending-item">
                <div className="pending-item-head">
                  <strong>{firstLine || "(Untitled note)"}</strong>
                  {n.note_date ? (
                    <span className="pending-meta">
                      {String(n.note_date)}
                    </span>
                  ) : null}
                </div>
                {subtitle ? (
                  <div className="pending-comment">{subtitle}</div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

