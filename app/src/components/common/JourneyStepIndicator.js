import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Car, Gauge, Tag } from 'lucide-react-native';

const STEPS = [
  { id: 1, label: 'Make & Model', shortLabel: 'Vehicle', icon: Car },
  { id: 2, label: 'Engine Trim', shortLabel: 'Engine', icon: Gauge },
  { id: 3, label: 'Verified Parts', shortLabel: 'Parts', icon: Tag },
];

const JourneyStepIndicator = ({ currentStep = 1, onStepPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEPS.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isPending = step.id > currentStep;
          const canPress = isCompleted && onStepPress;

          return (
            <React.Fragment key={step.id}>
              {/* Connector line between steps */}
              {idx > 0 && (
                <View
                  style={[
                    styles.connector,
                    isCompleted || isActive ? styles.connectorActive : styles.connectorPending,
                  ]}
                />
              )}

              {/* Step Circle & Label */}
              <TouchableOpacity
                style={styles.stepItem}
                onPress={() => canPress && onStepPress(step.id)}
                disabled={!canPress}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isActive && styles.circleActive,
                    isPending && styles.circlePending,
                  ]}
                >
                  {isCompleted ? (
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        isActive && styles.stepNumberActive,
                        isPending && styles.stepNumberPending,
                      ]}
                    >
                      {step.id}
                    </Text>
                  )}
                </View>

                <Text
                  style={[
                    styles.label,
                    isActive && styles.labelActive,
                    isCompleted && styles.labelCompleted,
                    isPending && styles.labelPending,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: 75,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  circleCompleted: {
    backgroundColor: '#059669', // Emerald Green
  },
  circleActive: {
    backgroundColor: '#D0142C', // NGK Crimson Red
    shadowColor: '#D0142C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  circlePending: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepNumberPending: {
    color: '#9CA3AF',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelActive: {
    color: '#D0142C',
    fontWeight: '700',
  },
  labelCompleted: {
    color: '#059669',
  },
  labelPending: {
    color: '#9CA3AF',
  },
  connector: {
    flex: 1,
    height: 2,
    marginTop: -14,
    marginHorizontal: 2,
    borderRadius: 1,
  },
  connectorActive: {
    backgroundColor: '#059669',
  },
  connectorPending: {
    backgroundColor: '#E5E7EB',
  },
});

export default JourneyStepIndicator;
