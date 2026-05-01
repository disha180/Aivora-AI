import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function LandingPage() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Aivora AI</Text>
        <Text style={styles.subtitle}>
          AI-Powered Social Media Trend Analysis
        </Text>
        <Text style={styles.description}>
          Discover current trends across Instagram, Facebook, SpaceX, WhatsApp, and Discord with intelligent insights powered by AI
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/signup')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>Why Aivora AI?</Text>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>{'📊'}</Text>
          <Text style={styles.featureTitle}>Real-Time Analytics</Text>
          <Text style={styles.featureDescription}>
            Get instant insights with graphs, charts, and detailed statistics
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>{'🤖'}</Text>
          <Text style={styles.featureTitle}>AI-Powered Insights</Text>
          <Text style={styles.featureDescription}>
            Leverage advanced AI to understand trends and get actionable recommendations
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>{'🌐'}</Text>
          <Text style={styles.featureTitle}>Multi-Platform Support</Text>
          <Text style={styles.featureDescription}>
            Analyze trends across all major social media platforms in one place
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>{'💬'}</Text>
          <Text style={styles.featureTitle}>24/7 AI Assistant</Text>
          <Text style={styles.featureDescription}>
            Get help anytime with our intelligent chatbot assistant
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>{'🛡️'}</Text>
          <Text style={styles.featureTitle}>Safe & Ethical</Text>
          <Text style={styles.featureDescription}>
            All content is filtered for safety and ethical standards
          </Text>
        </View>
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>Ready to discover trends?</Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.ctaButtonText}>Sign Up Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1929',
  },
  hero: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 140,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 140,
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  features: {
    padding: 24,
    paddingTop: 40,
  },
  featuresTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 32,
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: '#1e3a5f',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  cta: {
    padding: 24,
    paddingVertical: 60,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
