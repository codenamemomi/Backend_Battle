import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

// ─── Circle initials-avatar generator ───
function AvatarCircle({ name, size = 44, borderColor = '#475569', showCrown = false }) {
  const initials = (name || '??')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Deterministic background color based on name
  const colors = [
    '#6366F1', '#8B5CF6', '#EC4899', '#3B82F6', 
    '#10B981', '#F59E0B', '#EF4444', '#06B6D4'
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  const bgColor = colors[sum % colors.length];

  return (
    <View style={styles.avatarWrapper}>
      {showCrown && (
        <FontAwesome5
          name="crown"
          size={size * 0.52}
          color="#FFB800"
          style={[
            styles.crownIcon,
            {
              top: -size * 0.4,
              left: size * 0.22,
            }
          ]}
        />
      )}
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderWidth: 2,
          }
        ]}
      >
        <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
      </View>
    </View>
  );
}

export default function LeaderboardTab({
  leaderboardData,
  loadingLeaderboard,
  onFetchLeaderboard,
  getGradeColor,
  userOwner,
}) {
  const [timeFilter, setTimeFilter] = useState('Week'); // Today, Week, Month

  useEffect(() => {
    onFetchLeaderboard(timeFilter.toLowerCase());
  }, [timeFilter]);

  const filteredData = leaderboardData;

  // Find the user's best run in the full leaderboard list to show in the sticky footer
  const userBestRun = useMemo(() => {
    if (!userOwner || !userOwner.trim()) return null;
    const cleanUser = userOwner.trim().toLowerCase();

    // Search through the full leaderboard list to preserve actual global rank
    const userRuns = leaderboardData
      .map((item, index) => ({ item, index: index + 1 }))
      .filter((entry) => entry.item.owner.trim().toLowerCase() === cleanUser);

    if (userRuns.length === 0) return null;

    // Return the run with the highest score
    return userRuns.reduce((best, current) =>
      current.item.score > best.item.score ? current : best
    , userRuns[0]);
  }, [leaderboardData, userOwner]);

  // Extract top 3 elements for the podium
  const first = filteredData[0] || null;
  const second = filteredData[1] || null;
  const third = filteredData[2] || null;

  // Render rank trend indicator (pseudo-stable based on rank position)
  const renderTrend = (idx) => {
    if (idx % 3 === 0) {
      return <Ionicons name="chevron-up" size={12} color="#10B981" />;
    } else if (idx % 3 === 1) {
      return <Ionicons name="chevron-down" size={12} color="#F43F5E" />;
    } else {
      return <Ionicons name="remove" size={12} color="#475569" />;
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* ── HEADER ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          <Text style={styles.sectionAccent}>// </Text>HALL OF FAME
        </Text>
        <TouchableOpacity onPress={() => onFetchLeaderboard(timeFilter.toLowerCase())} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={14} color="#A78BFA" />
          <Text style={styles.refreshBtnText}>REFRESH</Text>
        </TouchableOpacity>
      </View>

      {/* ── TIME FILTERS ── */}
      <View style={styles.filterContainer}>
        {['Today', 'Week', 'Month'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterBtn, timeFilter === filter && styles.filterBtnActive]}
            onPress={() => setTimeFilter(filter)}
          >
            <Text style={[styles.filterBtnText, timeFilter === filter && styles.filterBtnTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadingLeaderboard ? (
        <ActivityIndicator size="large" color="#A78BFA" style={{ marginVertical: 48 }} />
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={40} color="#3C2A5C" />
          <Text style={styles.emptyText}>No qualifying entries in this period. Deploy and battle!</Text>
        </View>
      ) : (
        <View style={styles.leaderboardCard}>
          {/* ── PODIUM ROW ── */}
          <View style={styles.podiumRow}>
            {/* 2nd Place (Left) */}
            <View style={[styles.podiumCol, styles.podiumColSide]}>
              {second ? (
                <>
                  <AvatarCircle name={second.owner} size={46} borderColor="#94A3B8" />
                  <View style={[styles.podiumBadgeCircle, { backgroundColor: '#94A3B8' }]}>
                    <Text style={styles.podiumBadgeText}>2</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{second.api_name}</Text>
                  <Text style={styles.podiumDetail} numberOfLines={1}>by {second.owner}</Text>
                  <Text style={styles.podiumScore}>{second.score} pts</Text>
                </>
              ) : (
                <View style={styles.podiumPlaceholder} />
              )}
            </View>

            {/* 1st Place (Center) */}
            <View style={[styles.podiumCol, styles.podiumColCenter]}>
              {first ? (
                <>
                  <AvatarCircle name={first.owner} size={58} borderColor="#F59E0B" showCrown />
                  <View style={[styles.podiumBadgeCircle, { backgroundColor: '#F59E0B', width: 22, height: 22, borderRadius: 11, bottom: 64 }]}>
                    <Text style={styles.podiumBadgeText}>1</Text>
                  </View>
                  <Text style={[styles.podiumName, styles.podiumNameCenter]} numberOfLines={1}>{first.api_name}</Text>
                  <Text style={styles.podiumDetail} numberOfLines={1}>by {first.owner}</Text>
                  <Text style={[styles.podiumScore, styles.podiumScoreCenter]}>{first.score} pts</Text>
                </>
              ) : (
                <View style={styles.podiumPlaceholder} />
              )}
            </View>

            {/* 3rd Place (Right) */}
            <View style={[styles.podiumCol, styles.podiumColSide]}>
              {third ? (
                <>
                  <AvatarCircle name={third.owner} size={42} borderColor="#B45309" />
                  <View style={[styles.podiumBadgeCircle, { backgroundColor: '#B45309' }]}>
                    <Text style={styles.podiumBadgeText}>3</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{third.api_name}</Text>
                  <Text style={styles.podiumDetail} numberOfLines={1}>by {third.owner}</Text>
                  <Text style={styles.podiumScore}>{third.score} pts</Text>
                </>
              ) : (
                <View style={styles.podiumPlaceholder} />
              )}
            </View>
          </View>

          {/* ── RANKINGS TABLE ── */}
          <View style={styles.rankingsList}>
            {filteredData.map((item, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              
              // Top 3 Pill Color Configs
              let rowStyle = styles.rankRow;
              let nameStyle = styles.rankName;
              let ownerStyle = styles.rankOwner;
              let scoreStyle = styles.rankScore;
              
              if (rank === 1) {
                rowStyle = [styles.rankRow, styles.rankRowFirst];
                nameStyle = [styles.rankName, styles.rankTextDark];
                ownerStyle = [styles.rankOwner, styles.rankTextDarkMuted];
                scoreStyle = [styles.rankScore, styles.rankTextDark];
              } else if (rank === 2) {
                rowStyle = [styles.rankRow, styles.rankRowSecond];
                nameStyle = [styles.rankName, styles.rankTextDark];
                ownerStyle = [styles.rankOwner, styles.rankTextDarkMuted];
                scoreStyle = [styles.rankScore, styles.rankTextDark];
              } else if (rank === 3) {
                rowStyle = [styles.rankRow, styles.rankRowThird];
                nameStyle = [styles.rankName, styles.rankTextLight];
                ownerStyle = [styles.rankOwner, styles.rankTextLightMuted];
                scoreStyle = [styles.rankScore, styles.rankTextLight];
              }

              return (
                <View key={item.id} style={rowStyle}>
                  {/* Left rank trend block */}
                  <View style={styles.trendBlock}>
                    {isTop3 ? (
                      <View style={styles.trendSpacer} />
                    ) : (
                      <View style={styles.trendInner}>
                        {renderTrend(idx)}
                        <Text style={styles.trendRank}>{rank}</Text>
                      </View>
                    )}
                  </View>

                  {/* Competitor Avatar & Name */}
                  <View style={styles.competitorBlock}>
                    <AvatarCircle
                      name={item.owner}
                      size={isTop3 ? 34 : 32}
                      borderColor={isTop3 ? 'rgba(0,0,0,0.15)' : '#332352'}
                    />
                    <View style={styles.competitorMeta}>
                      <Text style={nameStyle} numberOfLines={1}>{item.api_name}</Text>
                      <Text style={ownerStyle} numberOfLines={1}>by {item.owner}</Text>
                    </View>
                  </View>

                  {/* Score */}
                  <View style={styles.scoreBlock}>
                    <Text style={scoreStyle}>{item.score} <Text style={{ fontSize: 9, opacity: 0.7 }}>pts</Text></Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── STICKY/HIGHLIGHTED USER FOOTER ── */}
          {userBestRun && (
            <View style={styles.stickyFooter}>
              <View style={styles.stickyRow}>
                <View style={styles.trendBlock}>
                  <View style={styles.trendInner}>
                    {renderTrend(userBestRun.index - 1)}
                    <Text style={[styles.trendRank, { color: '#E2E8F0' }]}>{userBestRun.index}</Text>
                  </View>
                </View>

                <View style={styles.competitorBlock}>
                  <AvatarCircle name={userBestRun.item.owner} size={32} borderColor="#6366F1" />
                  <View style={styles.competitorMeta}>
                    <Text style={[styles.rankName, { color: '#E2E8F0', fontWeight: '700' }]}>
                      You ({userBestRun.item.api_name})
                    </Text>
                    <Text style={[styles.rankOwner, { color: '#6366F1' }]}>by {userBestRun.item.owner}</Text>
                  </View>
                </View>

                <View style={styles.scoreBlock}>
                  <Text style={[styles.rankScore, { color: '#6366F1' }]}>
                    {userBestRun.item.score} <Text style={{ fontSize: 9, color: '#475569' }}>pts</Text>
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  sectionAccent: {
    color: '#A78BFA',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(167, 139, 250, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refreshBtnText: {
    color: '#A78BFA',
    fontSize: 9,
    fontWeight: '700',
  },

  // ── Time Filters ──
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1435',
    borderRadius: 20,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3C2A5C',
    alignSelf: 'flex-start',
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  filterBtnActive: {
    backgroundColor: '#382367',
  },
  filterBtnText: {
    color: '#7C6B9E',
    fontSize: 11,
    fontWeight: '700',
  },
  filterBtnTextActive: {
    color: '#E2E8F0',
  },

  // ── Empty State ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 12,
    backgroundColor: '#150E26',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#23153C',
  },
  emptyText: {
    color: '#7C6B9E',
    fontSize: 13,
    textAlign: 'center',
  },

  // ── Leaderboard Card Container ──
  leaderboardCard: {
    backgroundColor: '#150E26',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#23153C',
    paddingTop: 24,
    paddingHorizontal: 14,
    paddingBottom: 10,
    overflow: 'hidden',
  },

  // ── Podium ──
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginBottom: 28,
    paddingHorizontal: 6,
    height: 156,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  podiumColSide: {
    height: '100%',
  },
  podiumColCenter: {
    height: '100%',
    paddingBottom: 6,
  },
  podiumPlaceholder: {
    height: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  crownIcon: {
    position: 'absolute',
    zIndex: 15,
  },
  podiumBadgeCircle: {
    position: 'absolute',
    bottom: 58,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#150E26',
    zIndex: 20,
  },
  podiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  podiumName: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    width: 80,
  },
  podiumNameCenter: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  podiumDetail: {
    color: '#7C6B9E',
    fontSize: 9,
    marginTop: 1,
    textAlign: 'center',
    width: 70,
  },
  podiumScore: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  podiumScoreCenter: {
    color: '#FFB800',
    fontSize: 13,
  },

  // ── Rankings Table ──
  rankingsList: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 10,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: '#1E1435',
  },
  
  // Top 3 Fills
  rankRowFirst: {
    backgroundColor: '#FFB800', // Yellow
  },
  rankRowSecond: {
    backgroundColor: '#FFFFFF', // White
  },
  rankRowThird: {
    backgroundColor: '#FF6B00', // Orange
  },

  trendBlock: {
    width: 44,
  },
  trendInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendSpacer: {
    width: 1,
  },
  trendRank: {
    color: '#7C6B9E',
    fontSize: 11,
    fontWeight: '700',
  },
  competitorBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  competitorMeta: {
    flex: 1,
  },
  rankName: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  rankOwner: {
    color: '#7C6B9E',
    fontSize: 9,
    marginTop: 1,
  },
  scoreBlock: {
    alignItems: 'flex-end',
    width: 66,
  },
  rankScore: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
  },

  // Dark/Light text overrides for Top 3 pills
  rankTextDark: {
    color: '#0D051D',
    fontWeight: '700',
  },
  rankTextDarkMuted: {
    color: 'rgba(13, 5, 29, 0.6)',
  },
  rankTextLight: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rankTextLightMuted: {
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Sticky User Footer
  stickyFooter: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#23153C',
    paddingTop: 14,
    marginBottom: 4,
  },
  stickyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
});
