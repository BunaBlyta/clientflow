import { Children, Fragment, type PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '../../lib/theme';
import { Card } from './Card';
import { Divider } from './Divider';

interface ListPanelProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
}

// One shared glass panel for a list of rows, with a hairline divider between
// each — rows themselves stay flat, full-width, with no card of their own.
export function ListPanel({ children, style }: ListPanelProps) {
  const items = Children.toArray(children);
  return (
    <Card padding={0} style={style}>
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {items.map((child, index) => (
          <Fragment key={index}>
            {index > 0 && <Divider />}
            {child}
          </Fragment>
        ))}
      </View>
    </Card>
  );
}
