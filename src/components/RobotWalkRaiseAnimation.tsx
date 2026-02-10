import type { JSX } from 'react';

const ROBOT_IMAGE_URL = '/1r0nf1st-robot.png';

/** ViewBox aspect ratio for the full-body robot image (portrait-ish). */
const VIEWBOX_WIDTH = 200;
const VIEWBOX_HEIGHT = 280;

export interface RobotWalkRaiseAnimationProps {
  /** Optional CSS class for the root wrapper. */
  className?: string;
  /** Width in pixels (default 140). */
  width?: number;
  /** Height in pixels (default matches aspect ratio if only width given). */
  height?: number;
  /** If true, loop the animation; otherwise play once and hold final pose. */
  loop?: boolean;
}

export const RobotWalkRaiseAnimation = ({
  className = '',
  width = 140,
  height,
  loop = false,
}: RobotWalkRaiseAnimationProps): JSX.Element => {
  const h = height ?? Math.round((width * VIEWBOX_HEIGHT) / VIEWBOX_WIDTH);

  return (
    <div
      className={`${loop ? 'robot-walk-raise-loop' : 'robot-walk-raise'} ${className}`.trim()}
      style={{ width, height: h }}
      role="img"
      aria-label="1r0nf1st robot walking then raising hand"
    >
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        width={width}
        height={h}
        preserveAspectRatio="xMidYMid meet"
        className="block"
        aria-hidden
      >
        <image
          href={ROBOT_IMAGE_URL}
          x={0}
          y={0}
          width={VIEWBOX_WIDTH}
          height={VIEWBOX_HEIGHT}
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    </div>
  );
};
