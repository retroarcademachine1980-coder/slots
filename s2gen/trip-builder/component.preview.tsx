// Editor preview entry point.
import React from 'react';
import type { ComponentProps, FC } from 'react';
import { withDefaults, withFallbackPlaceholder } from '@wix/react-component-utils';
import Component from './trip-builder';
import { defaultProps } from './trip-builder.props';

const TripBuilderPreview: FC<ComponentProps<typeof Component>> = (props) => <Component {...props} />;

const TripBuilderPreviewWithFallback = withFallbackPlaceholder(TripBuilderPreview, {
  requiredDataFields: ['heading'],
  rootClassName: 'trip-builder',
});

export default withDefaults(TripBuilderPreviewWithFallback, defaultProps);
