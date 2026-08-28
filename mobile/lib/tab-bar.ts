import { spacing } from './theme';

// Single source of truth for the floating pill tab bar's dimensions, shared
// between app/(app)/_layout.tsx (which renders it) and components/ui/Screen
// (whose scroll content needs to clear it). Keeping these in one place
// means a future resize can't silently drift the two apart the way it did
// here: Screen's old bottom padding was computed independently of the tab
// bar's actual size, so when the bar became a smaller floating pill instead
// of a full-height edge-to-edge bar, scrolled content could render behind
// it — the last item in a long list was visible bleeding out from under
// the pill's edges.
export const TAB_BAR_HEIGHT = 60;
export const TAB_BAR_SIDE_MARGIN = spacing.lg;
export const TAB_BAR_BOTTOM_MARGIN = spacing.lg;

// The pill's total vertical footprint from the bottom of the screen, plus a
// little breathing room so scrolled content doesn't end up flush against
// it. The tab navigator's custom 'shift' animation (see
// app/(app)/_layout.tsx) renders each scene filling the whole screen
// rather than stopping above the tab bar's own reserved space, so this has
// to be accounted for explicitly in scroll content padding.
export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN + spacing.md;
