import { useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import { getPending, markPendingDone } from "../lib/api";

export default function PendingPage() {
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [markingId, setMarkingId] = useState<number | string | null>(null);

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
                  <th>Company</th>
                  <th>Position</th>
                  <th>Date</th>
                  <th>Comment</th>
                  <th>Link</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={String(p.id)}>
                    <td>{String(p.company ?? "-")}</td>
                    <td>{String(p.position_name ?? "-")}</td>
                    <td>{String(p.pending_date ?? "-")}</td>
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
    </>
  );
}
