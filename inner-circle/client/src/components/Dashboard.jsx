import React from 'react'
import { Card, Badge, Button, Grid } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle, Heart, Activity, Schedule, ChatBubbles, LayoutGrid, Journal, RefreshCW, EmojiHappy, EmojiSad } from 'lucide-react'

const Dashboards = ({ alias }: { alias: string }) => {
  // Sample data for trends
  const phq9Data = [
    { week: 'Week 1', score: 5 },
    { week: 'Week 2', score: 4 },
    { week: 'Week 3', score: 3 },
  ]

  const gad7Data = [
    { week: 'Week 1', score: 4 },
    { week: 'Week 2', score: 3 },
    { week: 'Week 3', score: 2 },
  ]

  const stressData = [
    { week: 'Week 1', score: 6 },
    { week: 'Week 2', score: 5 },
    { week: 'Week 3', score: 4 },
  ]

  // Trend determination
  const determineTrend = (data: any[]) => {
    if (data.length < 2) return 'Stable'
    const first = data[0]?.score ?? 0
    const last = data[data.length - 1]?.score ?? 0
    if (first - last >= 2) return 'Improving'
    if (last - first >= 2) return 'Worsening'
    return 'Stable'
  }

  const moodTrend = determineTrend(phq9Data)
  const gadTrend = determineTrend(gad7Data)
  const stressTrend = determineTrend(stressData)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar + Topbar already rendered by App.jsx */}

      <main className="p-8">
        {/* Gradient Hero Card */}
        <div className="bg-indigo-600 to-violet-500 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3">
            <i data-lucide="zap" className="w-6 h-6" />
            <span className="text-xl font-bold">INNER CIRCLE DASHBOARD</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Welcome back, {alias}!</h1>
          <p>How are you feeling today? Take a moment to check-in, explore calming practices, or reach out to your support circle.</p>
          <div className="mt-4 flex gap-3">
            <Button variant="contained" className="bg-white text-indigo-600 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors">
              Start mindful chat
            </Button>
            <Button variant="outlined" className="border-indigo-600 text-indigo-600 rounded-lg px-4 py-2 hover:bg-indigo-50 transition-colors">
              Schedule time with a guide
            </Button>
          </div>
        </div>

        {/* Mood Snapshot Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="font-medium text-gray-800">Mood Snapshot</h3>
              <p className="text-sm text-gray-500">Take a mindful pause — Try a 2-minute breathing reset or share a reflection with your accountability circle.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outlined" className="flex-1">
              <i data-lucide="zap" className="w-4 h-4 mr-2 align-middle" /> Breathing reset · 2 min
            </Button>
            <Button variant="outlined" className="flex-1">
              <i data-lucide="journal-text" className="w-4 h-4 mr-2 align-middle" /> Mood log · Guided prompts
            </Button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
          <h3 className="font-medium text-gray-800 mb-4">Quick Actions — Your mindful control center</h3>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="bg-primary/10 border border-primary rounded-xl p-4 hover:bg-primary/20 transition-colors cursor-pointer">
                <i data-lucide="message-circle" className="w-5 h-5 text-primary mb-3 block" /> Talk to AI
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="bg-primary/10 border border-primary rounded-xl p-4 hover:bg-primary/20 transition-colors cursor-pointer">
                <i data-lucide="calendar-check" className="w-5 h-5 text-primary mb-3 block" /> Take a Check-In
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="bg-primary/10 border border-primary rounded-xl p-4 hover:bg-primary/20 transition-colors cursor-pointer">
                <i data-lucide="zap" className="w-5 h-5 text-primary mb-3 block" /> Relax
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="bg-primary/10 border border-primary rounded-xl p-4 hover:bg-primary/20 transition-colors cursor-pointer">
                <i data-lucide="schedule" className="w-5 h-5 text-primary mb-3 block" /> Book Support
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="bg-primary/10 border border-primary rounded-xl p-4 hover:bg-primary/20 transition-colors cursor-pointer">
                <i data-lucide="search" className="w-5 h-5 text-primary mb-3 block" /> Explore Resources
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="bg-primary/10 border border-primary rounded-xl p-4 hover:bg-primary/20 transition-colors cursor-pointer">
                <i data-lucide="users" className="w-5 h-5 text-primary mb-3 block" /> Peer Circle
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="bg-primary/10 border border-primary rounded-xl p-4 hover:bg-primary/20 transition-colors cursor-pointer">
                <i data-lucide="journal" className="w-5 h-5 text-primary mb-3 block" /> Journal
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="bg-primary/10 border border-primary rounded-xl p-4 hover:bg-primary/20 transition-colors cursor-pointer">
                <i data-lucide="gifts" className="w-5 h-5 text-primary mb-3 block" /> Wellness Streak
              </Card>
            </Grid>
          </Grid>
        </div>

        {/* Your Well-Being Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
          <h3 className="font-medium text-gray-800 mb-3">Your Well-Being</h3>
          <div className="grid grid-cols-2 gap-4 text-gray-600 text-sm">
            <div>
              <p>Current level: Moderate</p>
              <p>PHQ-9 trend: <span className="font-medium">Improving</span> (5 → 3)</p>
              <p>GAD-7 trend: <span className="font-medium">Improving</span> (4 → 2)</p>
              <p>Stress trend: <span className="font-medium">Improving</span> (6 → 4)</p>
            </div>
            <div>
              <p>Last assessment: Feb 15, 2024</p>
              <p>Next check-in: <span className="font-medium">Tomorrow</span></p>
            </div>
          </div>
          <Button size="small" className="mt-4 w-full bg-primary text-white rounded-lg">
            Check in now
          </Button>
        </div>

        {/* Risk Trend Chip + Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
              {moodTrend}: {moodTrend === 'Improving' ? '📈' : moodTrend === 'Worsening' ? '📉' : '➡️'}
            </span>
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-gray-600">Your stress indicators have {moodTrend.toLowerCase()} over the last 3 check-ins.</span>
          </div>
          <div>
            <LineChart width="100%" height={150} data={phq9Data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis domain={['0', '10']} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#0EA5C6" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </div>
        </div>

        {/* Care Plan Ladder */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
          <h3 className="font-medium text-gray-800 mb-3">Your care plan</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Low</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">Tier 1</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Moderate</span>
              <Badge variant="outline" className="bg-amber-100 text-amber-800">Tier 2</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>High</span>
              <Badge variant="outline" className="bg-red-100 text-red-800">Tier 3</Badge>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="text-indigo-600 font-medium">You are here: Tier 2 — Moderate</span>
          </div>
        </div>

        {/* Recommended for you */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
          <h3 className="font-medium text-gray-800 mb-3">Recommended for you</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border rounded-xl border-gray-200">
              <h4>5-minute breathing exercise</h4>
              <p className="text-xs text-gray-500">Your recent check-in indicates elevated stress and anxiety.</p>
            </div>
            <div className="p-3 border rounded-xl border-gray-200">
              <h4>Academic Stress Resource</h4>
              <p className="text-xs text-gray-500">Your recent responses indicate academic pressure as a recurring concern.</p>
            </div>
            <div className="p-3 border rounded-xl border-gray-200">
              <h4>Grounding technique</h4>
              <p className="text-xs text-gray-500">Recent negative emotional expression detected.</p>
            </div>
            <div className="p-3 border rounded-xl border-gray-200">
              <h4>Sleep improvement guide</h4>
              <p className="text-xs text-gray-500">Stress levels indicate potential sleep disruption.</p>
            </div>
          </div>
        </div>

        {/* Streak widget */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-800">🌱 7-Day Wellness Journey</h3>
            <span className="text-xs text-gray-500">7 days streak</span>
          </div>
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center my-4">
            <span className="text-3xl text-primary">7</span>
          </div>
          <p className="text-center text-gray-500">Completed activities this week</p>
        </div>
      </main>
    </div>
  )
}

export default Dashboards