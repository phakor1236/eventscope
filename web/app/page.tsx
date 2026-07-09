"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./page.module.css";

type Stats = {
  byType: { event_name: string; count: number }[];
  daily: { day: string; count: number }[];
  totalStakeWei: string;
  checkpoints: { contract_addr: string; last_block: string }[];
};

type Ev = {
  event_name: string;
  args: Record<string, string | number>;
  block_number: string;
  block_time: string;
  tx_hash: string;
  log_index: number;
};

function weiToEth(wei: string): string {
  return (Number(wei) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--ink)",
};

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<Ev[] | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
    fetch("/api/events?limit=25").then((r) => r.json()).then((d) => setEvents(d.events));
  }, []);

  const totalEvents = stats?.byType.reduce((acc, t) => acc + t.count, 0) ?? 0;
  const lastBlock = stats?.checkpoints[0]?.last_block;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>EventScope</h1>
        <span className={styles.subtitle}>
          on-chain events of{" "}
          <a
            className={styles.txLink}
            href="https://sepolia.etherscan.io/address/0x769d821592cd0991ff243e3e4741413cb39db7af"
            target="_blank"
            rel="noreferrer"
          >
            PriceDuel
          </a>{" "}
          (FlipSide · Sepolia)
        </span>
      </header>
      <p className={styles.statusLine}>
        {lastBlock ? `indexed through block ${lastBlock}` : "loading…"}
      </p>

      <section className={styles.tiles}>
        <div className={styles.tile}>
          <div className={styles.tileLabel}>Total events</div>
          <div className={styles.tileValue}>{stats ? totalEvents : "–"}</div>
        </div>
        <div className={styles.tile}>
          <div className={styles.tileLabel}>Total staked (DuelCreated)</div>
          <div className={styles.tileValue}>
            {stats ? weiToEth(stats.totalStakeWei) : "–"}
            <span className={styles.tileUnit}>ETH</span>
          </div>
        </div>
        <div className={styles.tile}>
          <div className={styles.tileLabel}>Last indexed block</div>
          <div className={styles.tileValue}>{lastBlock ?? "–"}</div>
        </div>
      </section>

      <section className={styles.charts}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Events per day</h2>
          {stats && stats.daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.daily} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  stroke="var(--baseline)"
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  stroke="transparent"
                />
                <Tooltip cursor={{ fill: "var(--grid)", opacity: 0.4 }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="events" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.empty}>no data yet</div>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Events by type</h2>
          {stats && stats.byType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={stats.byType}
                layout="vertical"
                margin={{ top: 4, right: 24, bottom: 0, left: 8 }}
              >
                <CartesianGrid stroke="var(--grid)" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  stroke="var(--baseline)"
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="event_name"
                  width={110}
                  tick={{ fill: "var(--ink-2)", fontSize: 11 }}
                  stroke="transparent"
                />
                <Tooltip cursor={{ fill: "var(--grid)", opacity: 0.4 }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="events" fill="var(--series-1)" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.empty}>no data yet</div>
          )}
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Latest events</h2>
        <div className={styles.tableWrap}>
          {events && events.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Time (UTC)</th>
                  <th>Event</th>
                  <th>Duel #</th>
                  <th>Block</th>
                  <th>Tx</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={`${e.tx_hash}-${e.log_index}`}>
                    <td>{new Date(e.block_time).toISOString().slice(0, 16).replace("T", " ")}</td>
                    <td>
                      <span className={styles.eventTag}>
                        <span className={styles.dot} />
                        {e.event_name}
                      </span>
                    </td>
                    <td>{String(e.args.id ?? "–")}</td>
                    <td>{e.block_number}</td>
                    <td>
                      <a
                        className={styles.txLink}
                        href={`https://sepolia.etherscan.io/tx/${e.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {e.tx_hash.slice(0, 10)}…
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.empty}>{events ? "no events yet" : "loading…"}</div>
          )}
        </div>
      </section>
    </main>
  );
}
