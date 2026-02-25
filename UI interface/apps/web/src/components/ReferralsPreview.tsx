import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getReferrals } from "../lib/api";
import { formatTableDate } from "../lib/formatDate";
import Spinner from "./Spinner";

export default function ReferralsPreview() {
  const [rows, setRows] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        setLoading(true);
        const res = await getReferrals({ page: 1, limit: 10, filter: "open" });
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
        <div className="chart-empty">No open referrals.</div>
      ) : (
        <ul className="pending-list">
          {rows.map((r) => (
            <li key={String(r.id)} className="pending-item">
              <div className="pending-item-head">
                <strong>{String(r.company || "(no company)")}</strong>
                <span className="pending-meta">
                  {String(r.referral_received ?? "Requested")}
                </span>
              </div>
              {r.request_log ? (
                <div className="pending-pos">{String(r.request_log)}</div>
              ) : null}
              {r.request_date ? (
                <div className="pending-meta">
                  {formatTableDate(r.request_date)}
                </div>
              ) : null}
              {r.comment ? (
                <div className="pending-comment">{String(r.comment)}</div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <p style={{ marginTop: 12, fontSize: "0.85rem" }}>
        <Link to="/referrals" className="table-link">
          View all referrals
        </Link>
      </p>
    </div>
  );
}

