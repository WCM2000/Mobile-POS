import { StyleSheet } from 'react-native';

export const COLORS = {
  white: '#FFFFFF',
  professionalBlue: '#007BFF',
  gray: '#6c757d',
  darkCharcoal: '#212529',
};

export const globalStyles = StyleSheet.create({
  text: {
    color: COLORS.darkCharcoal,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});
