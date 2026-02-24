import { useEffect, useState } from "react";
import { getPending, markPendingDone } from "../lib/api";
import Spinner from "./Spinner";

export default function PendingList() {
  const [pendingItems, setPendingItems] = useState<Array<Record<string, any>>>([]);
  const [archiveItems, setArchiveItems] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const [pendingRes, archiveRes] = await Promise.all([
        getPending(false),
        getPending(true),
      ]);
      setPendingItems(pendingRes.data ?? []);
      setArchiveItems(archiveRes.data ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDone(id: number | string) {
    try {
      await markPendingDone(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function fmtDate(s?: string) {
    if (!s) return "";
    try {
      const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00Z`) : new Date(s);
      if (isNaN(d.getTime())) return s;
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return s;
    }
  }

  if (loading) return <div style={{ paddingTop: 8 }}><Spinner /></div>;

  return (
    <div>
      {error ? <div className="error">{error}</div> : null}
      <div>
        <strong>Pending</strong>
        {pendingItems.length === 0 ? (
          <div className="chart-empty">No pending items</div>
        ) : (
          <ul className="pending-list">
            {pendingItems.map((it: any) => (
              <li key={it.id} className="pending-item">
                <div className="pending-item-head">
                  <strong>{it.company || "(no company)"}</strong>
                  <button className="small-ghost" onClick={() => handleDone(it.id)}>Done</button>
                </div>
                {it.position_name ? <div className="pending-pos">{it.position_name}</div> : null}
                {it.pending_date ? <div className="pending-meta">{fmtDate(it.pending_date)}</div> : null}
                {it.comment ? <div className="pending-comment">{it.comment}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={{ marginTop: 24 }}>
        <strong>Archive</strong>
        {archiveItems.length === 0 ? (
          <div className="chart-empty">No archived items</div>
        ) : (
          <ul className="pending-list">
            {archiveItems.map((it: any) => (
              <li key={it.id} className="pending-item archived">
                <div className="pending-item-head">
                  <strong>{it.company || "(no company)"}</strong>
                </div>
                {it.position_name ? <div className="pending-pos">{it.position_name}</div> : null}
                {it.pending_date ? <div className="pending-meta">{fmtDate(it.pending_date)}</div> : null}
                {it.comment ? <div className="pending-comment">{it.comment}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
