import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GRADES = [
  { grade: 'S', range: '90+',   desc: 'Legendary',  color: '#F59E0B' },
  { grade: 'A', range: '80-89', desc: 'Excellent',  color: '#06B6D4' },
  { grade: 'B', range: '65-79', desc: 'Good',       color: '#3B82F6' },
  { grade: 'C', range: '50-64', desc: 'Average',    color: '#10B981' },
  { grade: 'D', range: '30-49', desc: 'Slow',       color: '#F97316' },
  { grade: 'F', range: '<30',   desc: 'Critical',   color: '#F43F5E' },
];

const SCORING = [
  {
    title: 'Average Latency',
    weight: '40 pts',
    desc: 'Full 40 pts for avg latency <50ms. Decays linearly to 0 at 3000ms.',
    icon: 'speedometer-outline',
  },
  {
    title: 'P95 Tail Latency',
    weight: '30 pts',
    desc: 'Measures consistency. Full 30 pts if <100ms; 0 pts at 5000ms.',
    icon: 'pulse-outline',
  },
  {
    title: 'Success Rate',
    weight: '20 pts',
    desc: 'Ratio of 2xx/3xx/4xx responses vs total. 100% success = 20 pts. 0% = 0 pts.',
    icon: 'checkmark-circle-outline',
  },
  {
    title: 'Throughput Bonus',
    weight: '10 pts',
    desc: 'RPS / 10, capped at 10 pts. Reaching ≥100 RPS earns the full bonus.',
    icon: 'flash-outline',
  },
];

const PROD = [
  { icon: 'server-outline',          title: 'Persistent DB',       desc: 'Swap in-memory dicts for PostgreSQL via SQLAlchemy + asyncpg.' },
  { icon: 'list-outline',            title: 'Job Queue',            desc: 'Use Redis + Celery/RQ to handle concurrent benchmark jobs safely.' },
  { icon: 'shield-checkmark-outline', title: 'Rate Limiting',       desc: 'Add per-IP submission caps to prevent benchmark flooding.' },
  { icon: 'key-outline',             title: 'API Key Auth',         desc: 'Gate submissions behind developer API keys.' },
  { icon: 'git-branch-outline',      title: 'CORS Policy',          desc: 'Restrict allow_origins to your deployed frontend domain only.' },
  { icon: 'save-outline',            title: 'Persistence',          desc: 'Results are currently lost on every server restart.' },
];

function SectionHeader({ icon, title }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color="#06B6D4" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function InfoTab() {
  return (
    <View>
      {/* ── SCORING ── */}
      <View style={styles.card}>
        <SectionHeader icon="calculator-outline" title="Scoring System" />
        <Text style={styles.intro}>
          Each benchmark scores <Text style={styles.hl}>0–100 points</Text> across four weighted dimensions:
        </Text>
        {SCORING.map((s) => (
          <View key={s.title} style={styles.ruleRow}>
            <View style={styles.ruleLeft}>
              <Ionicons name={s.icon} size={16} color="#06B6D4" />
              <Text style={styles.ruleTitle}>{s.title}</Text>
            </View>
            <Text style={styles.ruleWeight}>{s.weight}</Text>
            <Text style={styles.ruleDesc}>{s.desc}</Text>
          </View>
        ))}
      </View>

      {/* ── GRADES ── */}
      <View style={styles.card}>
        <SectionHeader icon="ribbon-outline" title="Performance Grades" />
        <View style={styles.gradeGrid}>
          {GRADES.map((g) => (
            <View key={g.grade} style={[styles.gradeCell, { borderLeftColor: g.color }]}>
              <Text style={[styles.gradeLetter, { color: g.color }]}>{g.grade}</Text>
              <View>
                <Text style={styles.gradeRange}>{g.range} pts</Text>
                <Text style={styles.gradeDesc}>{g.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── PRODUCTION ── */}
      <View style={styles.card}>
        <SectionHeader icon="construct-outline" title="Production Upgrade Checklist" />
        <Text style={styles.intro}>
          This server currently runs in prototype mode. Recommended hardening steps for production:
        </Text>
        {PROD.map((p, i) => (
          <View key={p.title} style={styles.prodRow}>
            <View style={styles.prodIconBox}>
              <Ionicons name={p.icon} size={16} color="#06B6D4" />
            </View>
            <View style={styles.prodContent}>
              <Text style={styles.prodTitle}>{p.title}</Text>
              <Text style={styles.prodDesc}>{p.desc}</Text>
            </View>
            <View style={styles.prodIndex}>
              <Text style={styles.prodIndexText}>{String(i + 1).padStart(2, '0')}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D1F1A',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1A3530',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A3530',
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  intro: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  hl: {
    color: '#06B6D4',
    fontWeight: '700',
  },

  // ── Scoring rules ──
  ruleRow: {
    backgroundColor: '#080C14',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A3530',
    padding: 12,
    marginBottom: 8,
  },
  ruleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ruleTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  ruleWeight: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ruleDesc: {
    color: '#475569',
    fontSize: 11,
    lineHeight: 16,
  },

  // ── Grades ──
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gradeCell: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#080C14',
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: '#1A3530',
    padding: 10,
  },
  gradeLetter: {
    fontSize: 22,
    fontWeight: '900',
    width: 26,
    textAlign: 'center',
  },
  gradeRange: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  gradeDesc: {
    color: '#475569',
    fontSize: 10,
    marginTop: 1,
  },

  // ── Production ──
  prodRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#111F1C',
  },
  prodIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(6,182,212,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1A3530',
    flexShrink: 0,
  },
  prodContent: {
    flex: 1,
  },
  prodTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  prodDesc: {
    color: '#475569',
    fontSize: 11,
    lineHeight: 16,
  },
  prodIndex: {
    alignSelf: 'center',
    flexShrink: 0,
  },
  prodIndexText: {
    color: '#1A3530',
    fontSize: 14,
    fontWeight: '800',
  },
});
