import { useEffect, useState } from "react";
import { getPending, markPendingDone } from "../lib/api";
import Spinner from "./Spinner";

export default function PendingPreview() {
  const [pendingItems, setPendingItems] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const pendingRes = await getPending(false);
      setPendingItems(pendingRes.data ?? []);
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
      {pendingItems.length === 0 ? (
        <div className="chart-empty" style={{ minHeight: 80 }}>
          No pending items. All clear.
        </div>
      ) : (
        <ul className="pending-list">
          {pendingItems.map((it: any) => (
            <li key={it.id} className="pending-item">
              <div className="pending-item-head">
                <strong>{it.company || "(no company)"}</strong>
                <button className="small-ghost" onClick={() => handleDone(it.id)}>
                  Done
                </button>
              </div>
              {it.position_name ? (
                <div className="pending-pos">{it.position_name}</div>
              ) : null}
              {it.pending_date ? (
                <div className="pending-meta">{String(it.pending_date)}</div>
              ) : null}
              {it.comment ? (
                <div className="pending-comment">{it.comment}</div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

