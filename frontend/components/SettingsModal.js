import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsModal({ visible, tempUrl, onChangeTempUrl, onSave, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <Ionicons name="settings-outline" size={18} color="#06B6D4" />
              <Text style={styles.sheetTitle}>API Configuration</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Backend Server URL</Text>
          <TextInput
            style={styles.input}
            value={tempUrl}
            onChangeText={onChangeTempUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={14} color="#0E7490" />
            <Text style={styles.hintText}>
              On a physical device via Expo Go, use your machine's LAN IP instead of localhost.
              {'\n'}Example: <Text style={styles.hintCode}>http://192.168.1.100:8000</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
            <Text style={styles.saveBtnText}>Save & Reconnect</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 12, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0D1F1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A3530',
    padding: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1A3530',
    paddingBottom: 12,
    marginBottom: 18,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
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
    fontSize: 14,
    marginBottom: 12,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(6,182,212,0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A3530',
    padding: 10,
    marginBottom: 18,
  },
  hintText: {
    color: '#475569',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  hintCode: {
    color: '#06B6D4',
    fontFamily: 'monospace',
  },
  saveBtn: {
    backgroundColor: '#0E7490',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
