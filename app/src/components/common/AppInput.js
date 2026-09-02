import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const AppInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = '#9CA3AF',
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  leftIcon,
  rightIcon,
  onRightIconPress,
  rightActionText,
  onRightActionPress,
  rightActionColor = '#C6122E',
  error,
  containerStyle,
  inputStyle,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  maxLength,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {(label || rightActionText) && (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {rightActionText && (
            <TouchableOpacity
              onPress={onRightActionPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.rightAction, { color: rightActionColor }]}>
                {rightActionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          multiline && styles.multilineContainer,
          error ? styles.inputError : null,
          !editable && styles.inputDisabled,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
        />

        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  rightAction: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 48,
    paddingHorizontal: 14,
  },
  multilineContainer: {
    height: 90,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.8,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  leftIconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    padding: 0,
    height: '100%',
  },
  multilineInput: {
    textAlignVertical: 'top',
    height: '100%',
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default AppInput;
