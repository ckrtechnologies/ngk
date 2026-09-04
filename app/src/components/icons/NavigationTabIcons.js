import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  Line,
} from 'react-native-svg';

// 1. PORTAL / HOME TAB ICON (Automotive HQ / Speedometer Dial)
export function PortalTabIcon({ focused = false, size = 24 }) {
  if (focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Defs>
          <LinearGradient id="tabPortalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#FEE2E2" />
          </LinearGradient>
        </Defs>
        {/* Solid House Base */}
        <Path
          d="M16 2.5l12 9.6a1 1 0 0 1 .4.8V26a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2V12.9a1 1 0 0 1 .4-.8L16 2.5z"
          fill="url(#tabPortalGrad)"
        />
        {/* Tachometer Core Arch in Deep Crimson */}
        <Path
          d="M12 28v-9a4 4 0 0 1 8 0v9"
          fill="#C6122E"
        />
        {/* Speedometer Needle */}
        <Line x1="16" y1="20" x2="18" y2="17" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
        <Circle cx="16" cy="20" r="1.5" fill="#FFFFFF" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M16 3.5l11.5 9.2V26a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 26V12.7L16 3.5z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.65}
      />
      <Path
        d="M12.5 27.5v-8a3.5 3.5 0 0 1 7 0v8"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.65}
      />
    </Svg>
  );
}

// 2. SEARCH / CATALOG TAB ICON (Precision Lens + Spark Plug Tip)
export function SearchTabIcon({ focused = false, size = 24 }) {
  if (focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Defs>
          <LinearGradient id="tabSearchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#FEE2E2" />
          </LinearGradient>
        </Defs>
        {/* Solid Lens Outer */}
        <Circle cx="13" cy="13" r="10" fill="url(#tabSearchGrad)" />
        {/* Inner Lens Core */}
        <Circle cx="13" cy="13" r="7" fill="#C6122E" />
        {/* Spark Star in Lens */}
        <Path
          d="M13 8.5v9M8.5 13h9"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* Handle */}
        <Path
          d="M20.5 20.5l8 8"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Circle
        cx="13"
        cy="13"
        r="9"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        opacity={0.65}
      />
      <Path
        d="M19.8 19.8l7.2 7.2"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={0.65}
      />
    </Svg>
  );
}

// 3. ENQUIRIES TAB ICON (Dialogue Bubble + Telemetry)
export function EnquiriesTabIcon({ focused = false, size = 24 }) {
  if (focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Defs>
          <LinearGradient id="tabEnqGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#D1FAE5" />
          </LinearGradient>
        </Defs>
        {/* Solid Speech Bubble Body */}
        <Path
          d="M5 6a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H12l-6 5v-5a4 4 0 0 1-1-2.5V6z"
          fill="url(#tabEnqGrad)"
        />
        {/* Diagnostic Wave in Bubble */}
        <Path
          d="M9 12h2.5l2-3 3 6 2-3h3.5"
          stroke="#059669"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M5.5 6.5A3 3 0 0 1 8.5 3.5h15a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H12l-5.5 4.5v-4.5a3 3 0 0 1-1-2V6.5z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.65}
      />
      <Path
        d="M10 11.5h12M10 15.5h7"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={0.65}
      />
    </Svg>
  );
}

// 4. DEALERS TAB ICON (Teardrop Storefront Pin)
export function DealersTabIcon({ focused = false, size = 24 }) {
  if (focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Defs>
          <LinearGradient id="tabDealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#FEF3C7" />
          </LinearGradient>
        </Defs>
        {/* Solid Pin Body */}
        <Path
          d="M16 2C10.5 2 6 6.5 6 12c0 7.5 10 17 10 17s10-9.5 10-17c0-5.5-4.5-10-10-10z"
          fill="url(#tabDealGrad)"
        />
        {/* Certified Dealership Core */}
        <Circle cx="16" cy="11.5" r="5" fill="#D97706" />
        {/* Storefront Roof */}
        <Path
          d="M13 10.5h6l.5 2H12.5l.5-2z"
          fill="#FFFFFF"
        />
        <Rect x="13.5" y="12.5" width="1" height="2" fill="#FFFFFF" />
        <Rect x="15.5" y="12.5" width="1" height="2" fill="#FFFFFF" />
        <Rect x="17.5" y="12.5" width="1" height="2" fill="#FFFFFF" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M16 3c-5 0-9 4-9 9 0 7 9 16 9 16s9-9 9-16c0-5-4-9-9-9z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.65}
      />
      <Circle
        cx="16"
        cy="12"
        r="3"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        opacity={0.65}
      />
    </Svg>
  );
}
