import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="sword-cross" size={26} color="#06B6D4" />
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>BACKEND BATTLE</Text>
          <Text style={styles.headerSub}>API Performance Arena</Text>
        </View>
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
});