import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

// ─── Unique stat bar: shows a value with a label and optional teal accent ───
function StatCell({ label, value, accent }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statCellLabel}>{label}</Text>
      <Text style={[styles.statCellValue, accent && { color: '#06B6D4' }]}>{value}</Text>
    </View>
  );
}

// ─── The inline score badge that floats beside the run card header ───
function ScoreBadge({ score, grade, gradeColor }) {
  return (
    <View style={[styles.scoreBadge, { borderColor: gradeColor }]}>
      <Text style={[styles.scoreBadgeGrade, { color: gradeColor }]}>{grade}</Text>
      <Text style={styles.scoreBadgePts}>
        {score}
        <Text style={styles.scoreBadgeUnit}>pts</Text>
      </Text>
    </View>
  );
}

// ─── Horizontal divider ───
function Divider() {
  return <View style={styles.divider} />;
}

export default function BattlegroundTab({
  apiName, setApiName,
  apiUrl, setApiUrl,
  owner, setOwner,
  httpMethod, setHttpMethod,
  headers, setHeaders,
  payload, setPayload,
  concurrentUsers, setConcurrentUsers,
  totalRequests, setTotalRequests,
  showAdvanced, setShowAdvanced,
  formError,
  submitting,
  onSubmit,
  recentRuns,
  loadingList,
  onFetchRecentRuns,
  getStatusColor,
  getGradeColor,
  selectedRunId,
  setSelectedRunId,
}) {
  // Find currently selected run, fallback to the latest run if not explicitly selected but list has elements
  const selectedRun = recentRuns.find((r) => r.id === selectedRunId) || null;

  const fmtMs = (v) => (v != null ? `${v} ms` : '—');
  const fmtPct = (v) => (v != null ? `${(v * 100).toFixed(1)}%` : '—');

  return (
    <View style={styles.container}>
      <View style={isWeb ? styles.webLayout : styles.mobileLayout}>
        {/* LEFT COLUMN: Input Form */}
        <View style={isWeb ? styles.leftCol : styles.fullCol}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="sword-cross" size={18} color="#06B6D4" />
              <Text style={styles.cardTitle}>Your Competitor Profile</Text>
            </View>

            {/* Input field: Competitor Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="terminal-outline" size={14} color="#06B6D4" />
                <Text style={styles.label}>Competitor Name</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g., FastAPI Rust-Binding"
                placeholderTextColor="#2E4A45"
                value={apiName}
                onChangeText={setApiName}
              />
            </View>

            {/* Input field: Endpoint URL */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="globe-outline" size={14} color="#06B6D4" />
                <Text style={styles.label}>Endpoint URL</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="https://your-api.com/endpoint"
                placeholderTextColor="#2E4A45"
                autoCapitalize="none"
                value={apiUrl}
                onChangeText={setApiUrl}
              />
            </View>

            {/* Input field: Owner / Team */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="person-outline" size={14} color="#06B6D4" />
                <Text style={styles.label}>Owner / Team</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g., Team Pyro"
                placeholderTextColor="#2E4A45"
                value={owner}
                onChangeText={setOwner}
              />
            </View>

            {/* Advanced Toggle */}
            <TouchableOpacity
              style={styles.advancedToggle}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              <View style={styles.advancedToggleRow}>
                <Text style={styles.advancedToggleText}>
                  {showAdvanced ? 'Hide Advanced Config' : 'Advanced Config'}
                </Text>
                <Ionicons
                  name={showAdvanced ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={14}
                  color="#06B6D4"
                />
              </View>
            </TouchableOpacity>

            {showAdvanced && (
              <View style={styles.advancedPanel}>
                <View style={styles.inputGroup}>
                  <Text style={styles.subLabel}>HTTP Method</Text>
                  <View style={styles.methodRow}>
                    {['GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.methodBtn, httpMethod === m && styles.methodBtnActive]}
                        onPress={() => setHttpMethod(m)}
                      >
                        <Text style={[styles.methodBtnText, httpMethod === m && styles.methodBtnTextActive]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.subLabel}>Headers (JSON)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder={'{ "Authorization": "Bearer token" }'}
                    placeholderTextColor="#2E4A45"
                    multiline
                    numberOfLines={3}
                    value={headers}
                    onChangeText={setHeaders}
                    autoCapitalize="none"
                  />
                </View>

                {httpMethod !== 'GET' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.subLabel}>Payload (JSON body)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder={'{ "key": "value" }'}
                      placeholderTextColor="#2E4A45"
                      multiline
                      numberOfLines={3}
                      value={payload}
                      onChangeText={setPayload}
                      autoCapitalize="none"
                    />
                  </View>
                )}

                <View style={styles.twoColRow}>
                  <View style={styles.col}>
                    <Text style={styles.subLabel}>Concurrency (max 50)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={concurrentUsers}
                      onChangeText={setConcurrentUsers}
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={styles.col}>
                    <Text style={styles.subLabel}>Total Requests (max 200)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={totalRequests}
                      onChangeText={setTotalRequests}
                    />
                  </View>
                </View>
              </View>
            )}

            {formError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#F43F5E" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.launchBtn, submitting && { opacity: 0.5 }]}
              onPress={onSubmit}
              disabled={submitting}
            >
              <LinearGradient
                colors={['#0E7490', '#06B6D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.launchBtnGrad}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.launchBtnText}>LAUNCH ATTACK</Text>
                    <Ionicons name="rocket" size={15} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* RIGHT COLUMN: Results Dashboard Panel */}
        <View style={isWeb ? styles.rightCol : styles.fullCol}>
          <View style={[styles.dashboardCard, selectedRun && styles.dashboardCardActive]}>
            {!selectedRun ? (
              // Welcome / Get Started State
              <View style={styles.getStartedContainer}>
                <View style={styles.getStartedIconCircle}>
                  <Ionicons name="trending-up-outline" size={38} color="#06B6D4" />
                </View>
                <Text style={styles.getStartedTitle}>Get Started</Text>
                <Text style={styles.getStartedDesc}>
                  Enter your competitor details to calculate your resilience score and test different stress scenarios.
                </Text>
              </View>
            ) : selectedRun.status === 'pending' || selectedRun.status === 'running' ? (
              // Running / Simulation State
              <View style={styles.runningContainer}>
                <ActivityIndicator size="large" color="#06B6D4" style={{ marginBottom: 20 }} />
                <Text style={styles.runningTitle}>Attack In Progress</Text>
                <Text style={styles.runningDesc}>
                  Generating concurrent traffic load on the target endpoint. Monitoring response metrics...
                </Text>
                <Divider />
                <View style={styles.detailMetaGrid}>
                  <View style={styles.detailMetaItem}>
                    <Text style={styles.detailMetaLabel}>COMPETITOR</Text>
                    <Text style={styles.detailMetaVal}>{selectedRun.api_name}</Text>
                  </View>
                  <View style={styles.detailMetaItem}>
                    <Text style={styles.detailMetaLabel}>ENDPOINT URL</Text>
                    <Text style={styles.detailMetaVal} numberOfLines={1}>{selectedRun.api_url}</Text>
                  </View>
                  <View style={styles.detailMetaItem}>
                    <Text style={styles.detailMetaLabel}>LOAD DETAILS</Text>
                    <Text style={styles.detailMetaVal}>
                      {selectedRun.concurrent_users} concurrency · {selectedRun.total_requests} requests
                    </Text>
                  </View>
                </View>
              </View>
            ) : selectedRun.status === 'failed' ? (
              // Failed Simulation State
              <View style={styles.failedContainer}>
                <View style={styles.failedHeaderRow}>
                  <Ionicons name="close-circle-outline" size={36} color="#F43F5E" />
                  <Text style={styles.failedTitle}>Simulation Failed</Text>
                </View>
                <Text style={styles.failedDesc}>
                  {selectedRun.error_message || 'Execution failed due to server timeout or network connection drop.'}
                </Text>
                <Divider />
                <View style={styles.detailMetaGrid}>
                  <View style={styles.detailMetaItem}>
                    <Text style={styles.detailMetaLabel}>COMPETITOR</Text>
                    <Text style={styles.detailMetaVal}>{selectedRun.api_name}</Text>
                  </View>
                  <View style={styles.detailMetaItem}>
                    <Text style={styles.detailMetaLabel}>ENDPOINT URL</Text>
                    <Text style={styles.detailMetaVal} numberOfLines={1}>{selectedRun.api_url}</Text>
                  </View>
                </View>
              </View>
            ) : (
              // Completed Dashboard State
              <View style={styles.resultsContainer}>
                <View style={styles.resultsHeader}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.dashboardName} numberOfLines={1}>{selectedRun.api_name}</Text>
                    <Text style={styles.dashboardUrl} numberOfLines={1}>by {selectedRun.owner} · {selectedRun.api_url}</Text>
                  </View>
                  <ScoreBadge
                    score={selectedRun.score}
                    grade={selectedRun.grade}
                    gradeColor={getGradeColor(selectedRun.grade)}
                  />
                </View>

                <Divider />

                <Text style={styles.sectionSubTitle}>PERFORMANCE SCORECARD</Text>
                <View style={styles.statGrid}>
                  <StatCell label="Success Rate" value={fmtPct(selectedRun.success_rate)} accent />
                  <StatCell label="Throughput" value={`${selectedRun.requests_per_second} RPS`} accent />
                  <StatCell label="Avg Latency" value={fmtMs(selectedRun.avg_latency_ms)} />
                  <StatCell label="P50 Latency" value={fmtMs(selectedRun.p50_latency_ms)} />
                  <StatCell label="P95 Latency" value={fmtMs(selectedRun.p95_latency_ms)} />
                  <StatCell label="P99 Latency" value={fmtMs(selectedRun.p99_latency_ms)} />
                </View>

                <Divider />

                <View style={styles.summaryMetaRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryItemLabel}>SUCCESSFUL</Text>
                    <Text style={[styles.summaryItemVal, { color: '#10B981' }]}>{selectedRun.total_successful}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryItemLabel}>FAILED</Text>
                    <Text style={[styles.summaryItemVal, { color: '#F43F5E' }]}>{selectedRun.total_failed}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryItemLabel}>LOAD CONFIG</Text>
                    <Text style={styles.summaryItemVal}>
                      {selectedRun.concurrent_users}c / {selectedRun.total_requests}r
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── RECENT SIMULATIONS LIST ── */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listSectionTitle}>
          <Text style={styles.sectionAccent}>// </Text>
          RECENT SIMULATIONS
        </Text>
        <TouchableOpacity onPress={onFetchRecentRuns} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={14} color="#06B6D4" />
          <Text style={styles.refreshBtnText}>REFRESH</Text>
        </TouchableOpacity>
      </View>

      {loadingList ? (
        <ActivityIndicator size="large" color="#06B6D4" style={{ marginVertical: 32 }} />
      ) : recentRuns.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-offline-outline" size={32} color="#1A3035" />
          <Text style={styles.emptyText}>No simulations completed. Deploy a competitor profile above.</Text>
        </View>
      ) : (
        <View style={styles.runsContainer}>
          {recentRuns.map((run) => {
            const isSelected = selectedRunId === run.id;
            const statusColor = getStatusColor(run.status);
            const isDone = run.status === 'completed';

            return (
              <TouchableOpacity
                key={run.id}
                onPress={() => setSelectedRunId(run.id)}
                style={[
                  styles.runRowCard,
                  isSelected && styles.runRowCardSelected,
                  { borderLeftColor: statusColor },
                ]}
              >
                <View style={styles.runRowContent}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={styles.rowTitleBlock}>
                      <Text style={styles.rowName} numberOfLines={1}>{run.api_name}</Text>
                      {isDone && (
                        <View style={[styles.rowGradeBadge, { backgroundColor: getGradeColor(run.grade) + '15', borderColor: getGradeColor(run.grade) }]}>
                          <Text style={[styles.rowGradeText, { color: getGradeColor(run.grade) }]}>{run.grade}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.rowUrl} numberOfLines={1}>{run.api_url}</Text>
                  </View>

                  <View style={styles.rowRightBlock}>
                    {isDone ? (
                      <Text style={styles.rowScoreText}>
                        {run.score} <Text style={styles.rowPtsText}>pts</Text>
                      </Text>
                    ) : (
                      <View style={[styles.rowStatusTag, { backgroundColor: statusColor + '10' }]}>
                        <Text style={[styles.rowStatusTagText, { color: statusColor }]}>
                          {run.status.toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.rowTimeText}>
                      {new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  webLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    marginBottom: 24,
  },
  mobileLayout: {
    flexDirection: 'column',
    gap: 20,
    marginBottom: 24,
  },
  leftCol: {
    width: 360,
  },
  rightCol: {
    flex: 1,
  },
  fullCol: {
    width: '100%',
  },

  // ── Input Card Styles ──
  card: {
    backgroundColor: '#0D1F1A',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1A3530',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A3530',
    paddingBottom: 10,
  },
  cardTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  label: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subLabel: {
    color: '#06B6D4',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#080C14',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A3530',
    color: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  advancedToggle: {
    paddingVertical: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1A3530',
  },
  advancedToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  advancedToggleText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '700',
  },
  advancedPanel: {
    marginTop: 8,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A3530',
    borderRadius: 6,
    backgroundColor: '#080C14',
  },
  methodBtnActive: {
    borderColor: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  methodBtnText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },
  methodBtnTextActive: {
    color: '#06B6D4',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },
  twoColRow: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: '#F43F5E',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  launchBtn: {
    borderRadius: 8,
    marginTop: 16,
    overflow: 'hidden',
  },
  launchBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  launchBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── Dashboard Card Styles (Right Column) ──
  dashboardCard: {
    backgroundColor: '#0D1F1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1A3530',
    padding: 20,
    minHeight: 320,
    justifyContent: 'center',
  },
  dashboardCardActive: {
    justifyContent: 'flex-start',
  },

  // Welcome Panel
  getStartedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  getStartedIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(6, 182, 212, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  getStartedTitle: {
    color: '#CBD5E1',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  getStartedDesc: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },

  // Running State
  runningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  runningTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  runningDesc: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
    maxWidth: 300,
  },
  detailMetaGrid: {
    width: '100%',
    backgroundColor: '#080C14',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1A3530',
    gap: 10,
    marginTop: 10,
  },
  detailMetaItem: {
    flexDirection: 'column',
  },
  detailMetaLabel: {
    color: '#06B6D4',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailMetaVal: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'monospace',
  },

  // Failed State
  failedContainer: {
    paddingVertical: 10,
  },
  failedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  failedTitle: {
    color: '#F43F5E',
    fontSize: 16,
    fontWeight: '700',
  },
  failedDesc: {
    color: '#FDA4AF',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 18,
  },

  // Completed State Dashboard
  resultsContainer: {
    width: '100%',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  dashboardName: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '800',
  },
  dashboardUrl: {
    color: '#475569',
    fontSize: 11,
    marginTop: 3,
  },
  scoreBadge: {
    borderWidth: 2,
    borderRadius: 12,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080C14',
  },
  scoreBadgeGrade: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  scoreBadgePts: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  scoreBadgeUnit: {
    color: '#475569',
    fontSize: 9,
  },
  sectionSubTitle: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCell: {
    width: '48%',
    backgroundColor: '#080C14',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A3530',
    padding: 10,
  },
  statCellLabel: {
    color: '#2E5A55',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statCellValue: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#080C14',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1A3530',
  },
  summaryItemLabel: {
    color: '#2E5A55',
    fontSize: 8,
    fontWeight: '800',
  },
  summaryItemVal: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1A3530',
    marginVertical: 14,
  },

  // ── Recent Simulation List Styles ──
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  listSectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionAccent: {
    color: '#06B6D4',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refreshBtnText: {
    color: '#06B6D4',
    fontSize: 9,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
    backgroundColor: '#0D1F1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A3530',
  },
  emptyText: {
    color: '#2E4A45',
    fontSize: 12,
    textAlign: 'center',
  },
  runsContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  runRowCard: {
    backgroundColor: '#0D1F1A',
    borderRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: '#1A3530',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  runRowCardSelected: {
    borderColor: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.03)',
  },
  runRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowName: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  rowGradeBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  rowGradeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  rowUrl: {
    color: '#334155',
    fontSize: 10,
    marginTop: 2,
  },
  rowRightBlock: {
    alignItems: 'flex-end',
  },
  rowScoreText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '800',
  },
  rowPtsText: {
    color: '#334155',
    fontSize: 9,
    fontWeight: '400',
  },
  rowStatusTag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rowStatusTagText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rowTimeText: {
    color: '#334155',
    fontSize: 9,
    marginTop: 2,
  },
});
