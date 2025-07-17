# Model Selector Grouping Feature Changelog

## Overview
This update implements a grouped and collapsible model selector feature that organizes AI models by their providers (e.g., OpenAI, Anthropic, Google) to improve user experience when dealing with long model lists.

## Feature Description
The Model Selector Grouping feature enables users to:
- View models organized by provider groups (OpenAI, Anthropic, Google, etc.)
- Collapse/expand model groups to reduce visual clutter
- Maintain the same selection functionality with improved organization
- See model counts for each group
- Navigate between groups with smooth animations

## Changes Made

### 1. Updated Model Grouping Utility (`app/utils/model-grouping.ts`) [MODIFIED]
- Created `GroupedItems<T>` interface for grouped item structure
- Added `ProviderInfo` interface to handle provider information
- Added `ModelWithProvider` interface for items with provider data
- Removed prefix-based `MODEL_GROUPS` array and `ModelGroup` interface
- Renamed `groupItemsByModelPrefix()` to `groupItemsByProvider()` function to categorize models by provider
- Updated `getGroupDisplayOrder()` function to use provider.sorted values for consistent ordering
- Models without provider information are grouped under "Other Models"
- Supports all providers from constant.ts: OpenAI, Azure, Google, Anthropic, Baidu, ByteDance, Alibaba, Tencent, Moonshot, Iflytek, XAI, ChatGLM, DeepSeek, SiliconFlow, 302.AI

### 2. Updated Selector Component (`app/components/ui-lib.tsx`) [MODIFIED]
- Updated imports to use new `groupItemsByProvider`, `getGroupDisplayOrder`, and `ModelWithProvider`
- Modified `GroupedSelector<T>` component to:
  - Accept `Array<ModelWithProvider>` as items type instead of generic object array
  - Use provider-based grouping instead of prefix-based grouping
  - Pass items array to `getGroupDisplayOrder()` for dynamic sorting
  - Maintain all existing functionality: grouped property, defaultExpandedGroups, expand/collapse state management
  - Preserve fallback to original `Selector` when `grouped=false`
  - Keep all original selector features (selection, multiple selection, etc.)

### 3. Styling and Animations (`app/components/ui-lib.module.scss`)
- Added `.selector-group-header` styles:
  - Flex layout with space-between alignment
  - Distinct background color and hover effects
  - Clickable cursor and user-select prevention
  - Smooth transitions for interactive states
- Added `.selector-group-title` for group name display with icon
- Added `.selector-group-icon` with rotation animation:
  - 180-degree rotation when expanded
  - Smooth 0.2s transition timing
- Added `.selector-group-count` for model count badges:
  - Rounded badge styling with primary color
  - Centered text alignment
- Added `.selector-group-content` for grouped items:
  - Increased left padding for visual hierarchy
  - Left border animation on hover
  - Improved hover states with color transitions

### 4. Updated Chat Interface Integration (`app/components/chat.tsx`) [MODIFIED]
- `GroupedSelector` import already existed from previous implementation
- Modified model items mapping to include `provider: m?.provider` for provider-based grouping
- Updated `defaultExpandedGroups` from `["GPT Models", "Claude Models"]` to `["OpenAI", "Anthropic"]` to match provider names
- Maintained all existing selection logic and callbacks
- Preserved model display formatting and provider information
- Kept `grouped={true}` property to enable grouping feature

### 5. Unified API Integration (`app/client/platforms/unified.ts`) [NEW]
- Added robust provider detection from API responses with `createProviderFromOwnedBy` method
- Implemented intelligent mapping of 'owned_by' fields to provider names and types
- Added support for major providers: OpenAI, Anthropic, Google, Meta, Mistral, Cohere
- Enhanced model grouping with provider information from unified API endpoints
- Improved error handling and logging for better debugging
- Ensured compatibility with model selector grouping feature

## Usage Instructions

1. Open any chat conversation
2. Click on the model selector button (robot icon) in the chat toolbar
3. The model selector will now display models organized by groups
4. Click on group headers to expand/collapse different model categories
5. Select any model from any group - selection works the same as before
6. Groups show model counts and remember their expanded/collapsed state during the session

## Technical Implementation Details

### Grouping Logic
- Models are automatically categorized by their provider information
- Uses provider.providerName for group names (e.g., "OpenAI", "Anthropic", "Google")
- Groups are sorted by provider.sorted values for consistent ordering
- Fallback to "Other Models" group for models without provider information
- Integration with Unified API to properly group models from third-party endpoints

### Component Architecture
- `GroupedSelector` extends the original `Selector` functionality
- Backward compatibility maintained through `grouped` prop
- State management using React hooks for expand/collapse
- Event propagation properly handled to prevent conflicts

### Performance Considerations
- Grouping is performed on-demand when selector opens
- Minimal re-renders through proper state management
- Smooth animations without affecting selection performance
- Memory efficient group state tracking

## UI/UX Improvements

### Visual Enhancements
- Clear visual hierarchy with group headers
- Smooth expand/collapse animations
- Consistent spacing and typography
- Hover effects for better interactivity
- Model count badges for quick reference

### Accessibility
- Proper click targets for group headers
- Visual feedback for interactive elements
- Maintained keyboard navigation support
- Consistent with existing design system

## Known Limitations
- Provider information must be available for proper grouping
- No support for custom grouping rules per user
- Groups are not persisted between sessions
- Limited to provider-based grouping only

## Future Enhancements
- User-customizable group definitions
- Persistent group expand/collapse states
- Search functionality within groups
- Alphabetical sorting within groups
- Support for custom grouping strategies
- Hybrid grouping (provider + model type)

## Latest Update (2025-01-17)

### Migration from Prefix-based to Provider-based Grouping
- **Breaking Change**: Changed from model name prefix matching to provider-based grouping
- **Improved Logic**: Now uses provider information from constant.ts for more accurate grouping
- **Better Organization**: Models are grouped by their actual provider (OpenAI, Anthropic, etc.) rather than name patterns
- **Enhanced Sorting**: Groups are ordered by provider.sorted values ensuring consistent display order
- **Backward Compatible**: Maintains the same UI and user experience while improving the underlying logic
- **Unified API Support**: Added integration with unified API endpoints to properly detect and group models from third-party services