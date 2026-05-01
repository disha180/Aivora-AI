import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import Modal from 'react-native-modal';
import { LineChart } from 'react-native-gifted-charts';
import ChatBot from '../../components/ChatBot';
import api from '../../utils/api';

export default function DiscordScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [topic, setTopic] = useState('');
  const [timePeriod, setTimePeriod] = useState('Last 7 days');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trendData, setTrendData] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else {
      loadHistory();
    }
  }, [isAuthenticated]);

  const loadHistory = async () => {
    try {
      const response = await api.get('/trends/history');
      setHistory(response.data.filter((item) => item.platform === 'Discord'));
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await api.post('/trends/analyze', {
        platform: 'Discord',
        topic,
        time_period: timePeriod,
        additional_requirements: additionalRequirements,
      });

      setTrendData(response.data);
      setShowAnalysisModal(false);
      setShowResultsModal(true);
      loadHistory();
    } catch (error) {
      Alert.alert(
        'Analysis Failed',
        error.response?.data?.detail || 'An error occurred'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const prepareChartData = (data) => {
    if (!data.chart_data || !data.chart_data.values) {
      return [];
    }

    return data.chart_data.values.map((value, index) => ({
      value,
      label: data.chart_data.labels[index] || `D${index + 1}`,
    }));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>{'🎮'}</Text>
          <Text style={styles.headerTitle}>Discord Trends</Text>
          <Text style={styles.headerSubtitle}>
            Discover what&apos;s trending on Discord
          </Text>
        </View>

        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={() => setShowAnalysisModal(true)}
        >
          <Text style={styles.analyzeButtonText}>Analyze New Trend</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Analyses</Text>
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No analyses yet</Text>
              <Text style={styles.emptySubtext}>
                Tap &quot;Analyze New Trend&quot; to get started
              </Text>
            </View>
          ) : (
            history.map((item) => (
              <TouchableOpacity
                key={item.analysis_id}
                style={styles.historyCard}
                onPress={() => {
                  setTrendData(item);
                  setShowResultsModal(true);
                }}
              >
                <Text style={styles.historyTopic}>{item.topic}</Text>
                <Text style={styles.historyPeriod}>{item.time_period}</Text>
                <Text style={styles.historySummary} numberOfLines={2}>
                  {item.summary}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Analysis Modal */}
      <Modal
        isVisible={showAnalysisModal}
        onBackdropPress={() => !isAnalyzing && setShowAnalysisModal(false)}
        onBackButtonPress={() => !isAnalyzing && setShowAnalysisModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Analyze Discord Trend</Text>

          <Text style={styles.label}>Topic / Keyword</Text>
          <TextInput
            style={styles.input}
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g., AI technology, Fashion trends"
            placeholderTextColor="#64748b"
          />

          <Text style={styles.label}>Time Period</Text>
          <View style={styles.periodContainer}>
            {['Last 7 days', 'Last 30 days', 'Last 90 days'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  timePeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setTimePeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    timePeriod === period && styles.periodButtonTextActive,
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Additional Requirements (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={additionalRequirements}
            onChangeText={setAdditionalRequirements}
            placeholder="Any specific requirements or focus areas..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAnalysisModal(false)}
              disabled={isAnalyzing}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Analyze</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Results Modal */}
      <Modal
        isVisible={showResultsModal}
        onBackdropPress={() => setShowResultsModal(false)}
        onBackButtonPress={() => setShowResultsModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <ScrollView>
            {trendData && (
              <>
                <Text style={styles.resultsTitle}>{trendData.topic}</Text>
                <Text style={styles.resultsPeriod}>{trendData.time_period}</Text>

                {/* Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Engagement</Text>
                    <Text style={styles.statValue}>
                      {trendData.stats.engagement_rate || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Growth</Text>
                    <Text style={styles.statValue}>
                      {trendData.stats.growth_trend || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Reach</Text>
                    <Text style={styles.statValue}>
                      {trendData.stats.estimated_reach || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Chart */}
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Trend Progression</Text>
                  {trendData.chart_data && trendData.chart_data.values && (
                    <LineChart
                      data={prepareChartData(trendData)}
                      width={300}
                      height={200}
                      color="#2563eb"
                      thickness={3}
                      startFillColor="#2563eb"
                      endFillColor="#2563eb20"
                      startOpacity={0.9}
                      endOpacity={0.2}
                      spacing={40}
                      noOfSections={5}
                      yAxisColor="#334155"
                      xAxisColor="#334155"
                      yAxisTextStyle={{ color: '#94a3b8' }}
                      xAxisLabelTextStyle={{ color: '#94a3b8', fontSize: 10 }}
                    />
                  )}
                </View>

                {/* Summary */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Summary</Text>
                  <Text style={styles.bodyText}>{trendData.summary}</Text>
                </View>

                {/* Instructions */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>How to Leverage This Trend</Text>
                  <Text style={styles.bodyText}>{trendData.instructions}</Text>
                </View>

                {/* Examples */}
                {trendData.examples && trendData.examples.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Examples</Text>
                    {trendData.examples.map((example, index) => (
                      <View key={index} style={styles.exampleCard}>
                        <Text style={styles.exampleNumber}>{index + 1}.</Text>
                        <Text style={styles.exampleText}>{example}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowResultsModal(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      <ChatBot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1929',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  analyzeButton: {
    backgroundColor: '#2563eb',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyTopic: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  historyPeriod: {
    fontSize: 14,
    color: '#2563eb',
    marginBottom: 8,
  },
  historySummary: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e3a5f',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  periodContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    backgroundColor: '#0a1929',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  periodButtonText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  submitButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  resultsPeriod: {
    fontSize: 16,
    color: '#2563eb',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0a1929',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: '#0a1929',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 24,
  },
  exampleCard: {
    flexDirection: 'row',
    backgroundColor: '#0a1929',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exampleNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginRight: 12,
  },
  exampleText: {
    flex: 1,
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
