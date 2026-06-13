import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import BattlegroundTab from './components/BattlegroundTab';
import LeaderboardTab from './components/LeaderboardTab';
import InfoTab from './components/InfoTab';

import {
  submitBenchmark,
  getBenchmarkResult,
  listBenchmarkResults,
  getLeaderboard,
  deleteBenchmarkResult,
  getBackendUrl,
  setBackendUrl,
  getApiKey,
  setApiKey,
  testConnection,
} from './api';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

export default function App() {
  const [activeTab, setActiveTab] = useState('battleground');
  const [backendUrl, setBackendUrlState] = useState(getBackendUrl());
  const [tempUrl, setTempUrl] = useState(getBackendUrl());
  const [apiKey, setApiKeyState] = useState(getApiKey());
  const [tempApiKey, setTempApiKey] = useState(getApiKey());
  const [showSettings, setShowSettings] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);

  const [recentRuns, setRecentRuns] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(null);

  const [apiName, setApiName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [owner, setOwner] = useState('');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [headers, setHeaders] = useState('');
  const [payload, setPayload] = useState('');
  const [concurrentUsers, setConcurrentUsers] = useState('10');
  const [totalRequests, setTotalRequests] = useState('50');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    checkBackendConnection();
    fetchInitialData();
  }, []);

  const checkBackendConnection = async () => {
    setCheckingConnection(true);
    const connected = await testConnection();
    setIsConnected(connected);
    setCheckingConnection(false);
  };

  const fetchInitialData = async () => {
    setLoadingList(true);
    setLoadingLeaderboard(true);
    try {
      const results = await listBenchmarkResults(15);
      setRecentRuns(results);
    } catch (e) {
      console.warn('Failed to fetch initial runs', e);
    } finally {
      setLoadingList(false);
    }
    try {
      const lb = await getLeaderboard(20);
      setLeaderboardData(lb);
    } catch (e) {
      console.warn('Failed to fetch leaderboard', e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const fetchRecentRuns = async () => {
    setLoadingList(true);
    try {
      const results = await listBenchmarkResults(15);
      setRecentRuns(results);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const lb = await getLeaderboard(20);
      setLeaderboardData(lb);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    const activeRuns = recentRuns.filter(
      (r) => r.status === 'pending' || r.status === 'running'
    );
    if (activeRuns.length === 0) return;

    const interval = setInterval(async () => {
      const nextRuns = await Promise.all(
        recentRuns.map(async (run) => {
          if (run.status === 'pending' || run.status === 'running') {
            try {
              return await getBenchmarkResult(run.id);
            } catch (e) {
              // 404 or network error — treat as failed so polling stops
              return { ...run, status: 'failed', error_message: 'Lost contact with server' };
            }
          }
          return run;
        })
      );

      const anyChanged = nextRuns.some((nr, idx) => nr.status !== recentRuns[idx]?.status);
      if (anyChanged) {
        setRecentRuns(nextRuns);
        const completedTransitions = nextRuns.some(
          (nr, idx) =>
            nr.status === 'completed' && recentRuns[idx]?.status !== 'completed'
        );
        if (completedTransitions) fetchLeaderboard();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [recentRuns]);

  const handleSaveSettings = async () => {
    setBackendUrl(tempUrl);
    setBackendUrlState(tempUrl);
    setApiKey(tempApiKey);
    setApiKeyState(tempApiKey);
    setShowSettings(false);
    setCheckingConnection(true);
    const connected = await testConnection();
    setIsConnected(connected);
    setCheckingConnection(false);
    fetchInitialData();
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!apiName.trim()) { setFormError('API Name is required'); return; }
    if (!apiUrl.trim()) { setFormError('Target URL is required'); return; }

    let parsedHeaders = null;
    let parsedPayload = null;

    if (headers.trim()) {
      try { parsedHeaders = JSON.parse(headers); }
      catch (_) { setFormError('Headers must be valid JSON'); return; }
    }
    if (payload.trim() && httpMethod !== 'GET') {
      try { parsedPayload = JSON.parse(payload); }
      catch (_) { setFormError('Payload must be valid JSON'); return; }
    }

    const cUsers = parseInt(concurrentUsers, 10);
    const tRequests = parseInt(totalRequests, 10);
    if (isNaN(cUsers) || cUsers < 1) { setFormError('Concurrent Users must be at least 1'); return; }
    if (isNaN(tRequests) || tRequests < cUsers) { setFormError('Total Requests must be ≥ Concurrent Users'); return; }

    setSubmitting(true);
    try {
      const submission = {
        name: apiName.trim(),
        url: apiUrl.trim(),
        http_method: httpMethod,
        description: 'Benchmark run from app',
        payload: parsedPayload,
        headers: parsedHeaders,
        owner: owner.trim() || 'Anonymous',
      };
      const result = await submitBenchmark(submission, cUsers, tRequests);
      const tempEntry = {
        id: result.result_id,
        submission_id: result.submission_id,
        api_name: submission.name,
        api_url: submission.url,
        owner: submission.owner,
        status: 'pending',
        created_at: new Date().toISOString(),
        concurrent_users: cUsers,
        total_requests: tRequests,
      };
      setRecentRuns([tempEntry, ...recentRuns]);
      setSelectedRunId(tempEntry.id);
      setApiName('');
      setApiUrl('');
      setFormError(null);
    } catch (err) {
      setFormError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':   return '#F59E0B';
      case 'running':   return '#06B6D4';
      case 'completed': return '#10B981';
      case 'failed':    return '#F43F5E';
      default:          return '#475569';
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'S': return '#F59E0B';
      case 'A': return '#06B6D4';
      case 'B': return '#3B82F6';
      case 'C': return '#10B981';
      case 'D': return '#F97316';
      case 'F': return '#F43F5E';
      default:  return '#475569';
    }
  };

  const TABS = [
    { key: 'battleground', label: 'Battleground', icon: 'flash-outline' },
    { key: 'leaderboard',  label: 'Leaderboard',  icon: 'trophy-outline' },
    { key: 'info',         label: 'Docs & Rules', icon: 'information-circle-outline' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#080C14', '#0D1F1A', '#0A1628']} style={styles.background}>

        <Header
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* TAB BAR */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={active ? '#06B6D4' : '#475569'}
                />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tabWrapper}>
            {activeTab === 'battleground' && (
              <BattlegroundTab
                apiName={apiName} setApiName={setApiName}
                apiUrl={apiUrl} setApiUrl={setApiUrl}
                owner={owner} setOwner={setOwner}
                httpMethod={httpMethod} setHttpMethod={setHttpMethod}
                headers={headers} setHeaders={setHeaders}
                payload={payload} setPayload={setPayload}
                concurrentUsers={concurrentUsers} setConcurrentUsers={setConcurrentUsers}
                totalRequests={totalRequests} setTotalRequests={setTotalRequests}
                showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced}
                formError={formError}
                submitting={submitting}
                onSubmit={handleSubmit}
                recentRuns={recentRuns}
                loadingList={loadingList}
                onFetchRecentRuns={fetchRecentRuns}
                getStatusColor={getStatusColor}
                getGradeColor={getGradeColor}
                selectedRunId={selectedRunId}
                setSelectedRunId={setSelectedRunId}
              />
            )}
            {activeTab === 'leaderboard' && (
              <LeaderboardTab
                leaderboardData={leaderboardData}
                loadingLeaderboard={loadingLeaderboard}
                onFetchLeaderboard={fetchLeaderboard}
                getGradeColor={getGradeColor}
                userOwner={owner}
              />
            )}
            {activeTab === 'info' && <InfoTab />}
          </View>
          <View style={{ height: 50 }} />
        </ScrollView>

        <SettingsModal
          visible={showSettings}
          tempUrl={tempUrl}
          onChangeTempUrl={setTempUrl}
          tempApiKey={tempApiKey}
          onChangeTempApiKey={setTempApiKey}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080C14',
  },
  background: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1A2F2A',
    backgroundColor: 'rgba(8, 12, 20, 0.95)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabButtonActive: {
    borderBottomColor: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  tabText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: '#06B6D4',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  tabWrapper: {
    width: '100%',
    maxWidth: isWeb ? 860 : '100%',
    alignSelf: 'center',
  },
});
