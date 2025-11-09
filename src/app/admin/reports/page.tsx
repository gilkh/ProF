"use client";

import React, { useEffect, useMemo, useState } from "react";
import { subscribeToReports, getAllUsersAndVendors } from "@/lib/services";
import type { Report, UserProfile } from "@/lib/types";

interface DisplayUser {
  id: string;
  name: string;
  role: "client" | "vendor";
  avatar?: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [usersIndex, setUsersIndex] = useState<Record<string, DisplayUser>>({});
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    unsub = subscribeToReports((list) => setReports(list));
    return () => {
      try { unsub && unsub(); } catch {}
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const allUsers = await getAllUsersAndVendors();
        if (cancelled) return;
        const index: Record<string, DisplayUser> = {};
        for (const u of allUsers as Array<UserProfile & { role: "client" | "vendor"; businessName?: string }>) {
          const name = u.role === "vendor" ? (u.businessName ?? `${u.firstName} ${u.lastName}`) : `${u.firstName} ${u.lastName}`;
          index[u.id] = { id: u.id, name, role: u.role, avatar: u.avatar };
        }
        setUsersIndex(index);
      } finally {
        setLoadingUsers(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const topAccounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reports) {
      if (!r.reportedUserId) continue;
      counts[r.reportedUserId] = (counts[r.reportedUserId] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [reports]);

  return (
    <div className="p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reported Accounts</h1>
        <span className="text-sm text-gray-500">Total reports: {reports.length}</span>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">Top Reported Accounts</h2>
        <div className="overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topAccounts.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-500" colSpan={3}>No reported accounts.</td>
                </tr>
              )}
              {topAccounts.map(({ userId, count }) => {
                const user = usersIndex[userId];
                return (
                  <tr key={userId}>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        {user?.avatar && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                        )}
                        <div>
                          <div className="font-medium">{user?.name ?? userId}</div>
                          <div className="text-xs text-gray-500">ID: {userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user?.role ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">All Reports</h2>
        <div className="overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported Account</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-500" colSpan={4}>No reports yet.</td>
                </tr>
              )}
              {reports.map((r) => {
                const reported = usersIndex[r.reportedUserId];
                const reporter = usersIndex[r.reporterId];
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        {reported?.avatar && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={reported.avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                        )}
                        <div>
                          <div className="font-medium">{reported?.name ?? r.reportedUserId}</div>
                          <div className="text-xs text-gray-500">Role: {reported?.role ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        {reporter?.avatar && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={reporter.avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                        )}
                        <div>
                          <div className="font-medium">{reporter?.name ?? r.reporterId}</div>
                          <div className="text-xs text-gray-500">Role: {reporter?.role ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[28rem] whitespace-pre-wrap">{r.comment ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {loadingUsers && (
          <div className="text-xs text-gray-500">Loading account info…</div>
        )}
      </section>
    </div>
  );
}