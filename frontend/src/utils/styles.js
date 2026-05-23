import { StyleSheet } from 'react-native';

export const COLORS = {
  // Brand Colors
  primary: '#0EA5E9', // Ocean Blue
  primaryDark: '#0284C7',
  accent: '#6366F1', // Indigo
  accentLight: '#EEF2F6',
  
  // Backgrounds
  darkBg: '#0F172A', // Slate 900
  darkCard: '#1E293B', // Slate 800
  lightBg: '#F8FAFC', // Slate 50
  lightCard: '#FFFFFF',
  
  // Borders
  borderLight: '#E2E8F0',
  borderDark: '#334155',
  
  // Text Colors
  textDark: '#0F172A',
  textMuted: '#64748B',
  textLight: '#F8FAFC',
  textWhite: '#FFFFFF',
  
  // Semantic Colors
  success: '#10B981', // Emerald Green
  successLight: '#ECFDF5',
  warning: '#F59E0B', // Amber
  warningLight: '#FEF3C7',
  danger: '#EF4444', // Rose Red
  dangerLight: '#FEF2F2',
  
  // Transparent / Glassmorphism tints
  glassWhite: 'rgba(255, 255, 255, 0.15)',
  glassDark: 'rgba(15, 23, 42, 0.6)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  card: {
    backgroundColor: COLORS.lightCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  buttonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: COLORS.lightCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: COLORS.textDark,
    fontSize: 15,
    marginTop: 8,
  },
});
