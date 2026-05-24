import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { COLORS, SHADOWS } from '../utils/styles';

const { width, height } = Dimensions.get('window');

const SplashLoginScreen = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Animations
  const logoScale = useState(new Animated.Value(0.3))[0];
  const logoOpacity = useState(new Animated.Value(0))[0];
  const formSlide = useState(new Animated.Value(100))[0];
  const formOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Splash screen animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1.1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(logoScale, {
        toValue: 1.0,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-transition from Splash to Login after 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
      // Trigger Login Form Entry Animation
      Animated.parallel([
        Animated.timing(formSlide, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    if (!username || !password) {
      alert('Please fill in all fields');
      return;
    }
    setLoading(true);
    // Simulate API authorization call
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess();
    }, 1500);
  };

  const triggerQuickLogin = () => {
    setUsername('admin');
    setPassword('admin123');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess();
    }, 800);
  };

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        {/* Glow Effects */}
        <View style={[styles.glowBall, styles.glowBlue]} />
        <View style={[styles.glowBall, styles.glowPurple]} />

        <Animated.View
          style={[
            styles.logoContainer,
            { transform: [{ scale: logoScale }], opacity: logoOpacity },
          ]}
        >
          {/* Glowing Emblem */}
          <View style={styles.logoBadge}>
            <Text style={styles.logoSymbol}>O₃</Text>
          </View>
          <Text style={styles.logoName}>O3 POS</Text>
          <Text style={styles.logoTagline}>Professional Smart Retail System</Text>
        </Animated.View>

        <View style={styles.splashFooter}>
          <ActivityIndicator color={COLORS.primary} size="small" />
          <Text style={styles.versionText}>v2.0.4 Premium Edition</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.loginContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          {/* Subtle Background Glows */}
          <View style={[styles.glowBallMini, styles.glowBlueMini]} />
          <View style={[styles.glowBallMini, styles.glowPurpleMini]} />

          {/* O3 Mini Header */}
          <View style={styles.loginHeader}>
            <View style={styles.logoBadgeMini}>
              <Text style={styles.logoSymbolMini}>O₃</Text>
            </View>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>Sign in to access your dashboard</Text>
          </View>

          {/* Interactive Login Card */}
          <Animated.View
            style={[
              styles.cardContainer,
              { transform: [{ translateY: formSlide }], opacity: formOpacity },
            ]}
          >
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username or Email</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickLoginBtn} onPress={triggerQuickLogin}>
              <Text style={styles.quickLoginText}>✨ Quick Demo Login</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer stats / system details */}
          <View style={styles.loginSystemInfo}>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillText}>✓ 58/80mm Thermal Print</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillText}>✓ GST/SST Active</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillText}>✓ Unlimited Database</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Splash Screen styles
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowBall: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  glowBlue: {
    width: width * 1.2,
    height: width * 1.2,
    backgroundColor: COLORS.primary,
    top: -width * 0.4,
    left: -width * 0.2,
  },
  glowPurple: {
    width: width * 1.2,
    height: width * 1.2,
    backgroundColor: COLORS.accent,
    bottom: -width * 0.4,
    right: -width * 0.2,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  logoSymbol: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(14, 165, 233, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  logoName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 20,
    letterSpacing: 1,
  },
  logoTagline: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  splashFooter: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 10,
    letterSpacing: 1,
  },

  // Login Screen styles
  loginContainer: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  glowBallMini: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.08,
  },
  glowBlueMini: {
    width: 300,
    height: 300,
    backgroundColor: COLORS.primary,
    top: 50,
    left: -100,
  },
  glowPurpleMini: {
    width: 300,
    height: 300,
    backgroundColor: COLORS.accent,
    bottom: 50,
    right: -100,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 35,
  },
  logoBadgeMini: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: COLORS.darkBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    ...SHADOWS.medium,
  },
  logoSymbolMini: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 5,
  },
  cardContainer: {
    backgroundColor: COLORS.lightCard,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.large,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
    paddingLeft: 2,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.textDark,
  },
  loginBtn: {
    backgroundColor: COLORS.darkBg,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...SHADOWS.medium,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  quickLoginBtn: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  quickLoginText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
  loginSystemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  infoPill: {
    backgroundColor: '#EEF2F6',
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  infoPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});

export default SplashLoginScreen;
