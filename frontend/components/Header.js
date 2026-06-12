import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function Header({ isConnected, checkingConnection, onCheckConnection, onOpenSettings }) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="sword-cross" size={26} color="#06B6D4" />
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>BACKEND BATTLE</Text>
          <Text style={styles.headerSub}>API Performance Arena</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.statusPill, { borderColor: isConnected ? '#10B981' : '#F43F5E' }]}
          onPress={onCheckConnection}
        >
          {checkingConnection ? (
            <ActivityIndicator size="small" color="#06B6D4" />
          ) : (
            <>
              <View style={[styles.dot, { backgroundColor: isConnected ? '#10B981' : '#F43F5E' }]} />
              <Text style={[styles.statusLabel, { color: isConnected ? '#10B981' : '#F43F5E' }]}>
                {isConnected ? 'LIVE' : 'DOWN'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsBtn} onPress={onOpenSettings}>
          <Ionicons name="settings-outline" size={22} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2F2A',
    backgroundColor: 'rgba(8, 12, 20, 0.98)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleBlock: {
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  headerSub: {
    color: '#06B6D4',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  settingsBtn: {
    padding: 4,
  },
});
