"use client";

import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui/shared";
import { Activity, ArrowLeft, Zap, ShieldAlert, Cpu } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const dataDistribution = [
  { name: 'Billing', value: 340, color: '#3b82f6' },
  { name: 'Technical', value: 290, color: '#8b5cf6' },
  { name: 'Account', value: 180, color: '#10b981' },
  { name: 'Delivery', value: 120, color: '#f59e0b' },
  { name: 'Other', value: 70, color: '#64748b' },
];

const urgencyData = [
  { name: 'Critical', value: 8, fill: '#ef4444' },
  { name: 'Urgent', value: 22, fill: '#f97316' },
  { name: 'Today', value: 32, fill: '#3b82f6' },
  { name: 'Routine', value: 38, fill: '#64748b' },
];

export default function Analytics() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Activity className="w-5 h-5 text-indigo-600" />
          Support Analytics
        </div>
        <Link href="/">
          <Button variant="outline" className="text-sm flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Workspace
          </Button>
        </Link>
      </header>

      <div className="p-6 max-w-6xl mx-auto w-full flex flex-col gap-6">
        {/* Top metrics */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium">Tickets Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1,284</div>
              <p className="text-xs text-slate-500 mt-1">+12% from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium">Auto-routed (System 1)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">82%</div>
              <p className="text-xs text-slate-500 mt-1">No human intervention needed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium">SLA Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">17%</div>
              <p className="text-xs text-slate-500 mt-1">Critical/Urgent cases</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 font-medium">Estimated AI Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">-43%</div>
              <p className="text-xs text-slate-500 mt-1">Generative LLM tokens saved</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Chart 1 */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Distribution by Topic</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-1/2 flex flex-col gap-2">
                {dataDistribution.map(d => (
                  <div key={d.name} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-semibold">{((d.value / 1000) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chart 2 */}
          <Card>
            <CardHeader>
              <CardTitle>Urgency Profile</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={urgencyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {urgencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance comparison */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-2 font-semibold text-slate-700 mb-4">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  System 1 (Decision Layer)
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="text-slate-500">Average Latency</span>
                    <span className="font-medium">180 ms</span>
                  </div>
                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="text-slate-500">Decisions Made</span>
                    <span className="font-medium">1,284</span>
                  </div>
                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="text-slate-500">Human Reviews Required</span>
                    <span className="font-medium">11%</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 font-semibold text-slate-700 mb-4">
                  <Cpu className="w-4 h-4 text-purple-500" />
                  System 2 (Generative Copilot)
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="text-slate-500">Average Latency</span>
                    <span className="font-medium">2.1 s</span>
                  </div>
                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="text-slate-500">Drafts Generated</span>
                    <span className="font-medium">731</span>
                  </div>
                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="text-slate-500">LLM Calls Avoided (via System 1)</span>
                    <span className="font-medium text-green-600">553</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
