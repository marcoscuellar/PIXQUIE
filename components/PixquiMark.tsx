import * as React from "react";

type Props = {
  size?: number;
  /** outer ring stroke colour */
  stroke?: string;
  outerWidth?: number;
  innerWidth?: number;
  innerOpacity?: number;
  /** fill of the centre dot (matches the surface behind the mark) */
  center?: string;
};

/**
 * The Pixqui spiral mark. Stroke widths, the inner-arc opacity and the centre-dot
 * fill vary by context in the design references, so they are all parameterised.
 */
export default function PixquiMark({
  size = 28,
  stroke = "#14110F",
  outerWidth = 2.4,
  innerWidth = 1.7,
  innerOpacity = 0.85,
  center = "#14110F",
}: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden="true">
      <path
        d="M44.3 14.1 A21.8 21.8 0 1 1 37.9 7.7"
        stroke={stroke}
        strokeWidth={outerWidth}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M36.7 16.1 A11.4 11.4 0 0 1 34.3 37.2"
        stroke="#E8B923"
        strokeWidth={innerWidth}
        strokeLinecap="round"
        fill="none"
        opacity={innerOpacity}
      />
      <circle cx="26" cy="26" r="6.5" fill="#E8B923" />
      <circle cx="26" cy="26" r="2.3" fill={center} />
    </svg>
  );
}
