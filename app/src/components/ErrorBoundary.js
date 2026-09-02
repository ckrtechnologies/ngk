import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('App ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconBadge}>
              <Text style={styles.iconText}>!</Text>
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              An unexpected display issue occurred. Please tap below to reload.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.8}
              onPress={this.handleReset}
            >
              <Text style={styles.retryText}>Reload Screen</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F121C',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('6%'),
  },
  card: {
    width: '100%',
    backgroundColor: '#1B1E2B',
    borderRadius: wp('4%'),
    padding: wp('6%'),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconBadge: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    backgroundColor: 'rgba(198, 18, 46, 0.15)',
    borderWidth: 1,
    borderColor: '#C6122E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  iconText: {
    fontSize: wp('7%'),
    fontWeight: '900',
    color: '#C6122E',
  },
  title: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: hp('1%'),
  },
  message: {
    fontSize: wp('3.6%'),
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: wp('5.2%'),
    marginBottom: hp('3%'),
  },
  retryButton: {
    backgroundColor: '#C6122E',
    paddingHorizontal: wp('8%'),
    paddingVertical: hp('1.8%'),
    borderRadius: wp('3%'),
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: wp('3.8%'),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default ErrorBoundary;
