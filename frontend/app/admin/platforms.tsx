import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import Modal from 'react-native-modal';
import api from '../../utils/api';

interface Platform {
  platform_id: string;
  name: string;
  icon: string;
  description: string;
  is_active: boolean;
}

export default function PlatformsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'editor' && user.role !== 'admin')) {
      router.replace('/');
      return;
    }
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      const response = await api.get('/platforms');
      setPlatforms(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load platforms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPlatform(null);
    setName('');
    setIcon('');
    setDescription('');
    setShowModal(true);
  };

  const handleEdit = (platform: Platform) => {
    setEditingPlatform(platform);
    setName(platform.name);
    setIcon(platform.icon);
    setDescription(platform.description);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name || !icon || !description) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingPlatform) {
        await api.put(`/platforms/${editingPlatform.platform_id}`, {
          name,
          icon,
          description,
        });
      } else {
        await api.post('/platforms', {
          name,
          icon,
          description,
        });
      }
      setShowModal(false);
      loadPlatforms();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save platform');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (platform: Platform) => {
    Alert.alert(
      'Delete Platform',
      `Are you sure you want to delete ${platform.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/platforms/${platform.platform_id}`);
              loadPlatforms();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete platform');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Platforms</Text>
        <TouchableOpacity
          onPress={handleAdd}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {platforms.map((platform) => (
          <View key={platform.platform_id} style={styles.platformCard}>
            <Text style={styles.platformIcon}>{platform.icon}</Text>
            <View style={styles.platformInfo}>
              <Text style={styles.platformName}>{platform.name}</Text>
              <Text style={styles.platformDescription}>{platform.description}</Text>
            </View>
            <View style={styles.platformActions}>
              <TouchableOpacity
                onPress={() => handleEdit(platform)}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(platform)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        isVisible={showModal}
        onBackdropPress={() => !isSaving && setShowModal(false)}
        onBackButtonPress={() => !isSaving && setShowModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingPlatform ? 'Edit Platform' : 'Add Platform'}
          </Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Platform name"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Icon (emoji)</Text>
          <TextInput
            style={styles.input}
            value={icon}
            onChangeText={setIcon}
            placeholder="📱"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Platform description"
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1929',
  },
  loading: {
    flex: 1,
    backgroundColor: '#0a1929',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a5f',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  platformCard: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  platformIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  platformInfo: {
    marginBottom: 12,
  },
  platformName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  platformDescription: {
    fontSize: 14,
    color: '#94a3b8',
  },
  platformActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e3a5f',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0a1929',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});