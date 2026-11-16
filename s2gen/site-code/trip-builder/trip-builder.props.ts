import type { Direction } from '@wix/editor-react-types';

export type TripBuilderProps = {
  id: string;
  className?: string;
  /** "planner" shows the whole trip builder with fuel prices; "fuel" shows only the fuel price finder. */
  mode?: string;
  /** Town or postcode district the fuel finder starts with (town pages). */
  town?: string;
  direction?: Direction;
};

export const defaultProps = {
  mode: 'planner',
  town: '',
} as const satisfies Omit<TripBuilderProps, 'id' | 'className'>;
