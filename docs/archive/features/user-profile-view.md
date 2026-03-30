# Feature: User Profile View (TV Time Style)

## Overview

Implementación de la página de perfil de usuario al estilo TV Time, con visualización de estadísticas de consumo de media y listas de contenido favorito/visto.

## Architecture

### Domain Layer

**UserProfile Entity** (`src/modules/social/domain/user-profile.ts`):
- `UserProfile`: Base profile data (id, name, username, avatar, banner)
- `UserProfileWithStats`: Profile with consumption statistics
- `UserProfileWithContent`: Profile with media lists
- `UserProfileContentQuery`: Query parameters for filtering content
- `UpdateProfileData`: Data structure for profile updates

### Repository Layer

**UserProfileRepository** (`src/modules/social/domain/user-profile.repository.ts`):
- `getProfileById(userId)`: Get profile by user ID
- `getProfileByUsername(username)`: Get profile by username
- `getProfileContent(query)`: Get filtered media content
- `updateProfile(userId, data)`: Update profile data
- `isUsernameAvailable(username, excludeUserId)`: Check username availability

**SupabaseUserProfileRepository** (`src/modules/social/infrastructure/repositories/`):
- Supabase implementation of the repository interface
- Handles data mapping between Supabase and domain entities
- Uses RLS (Row Level Security) for data protection

### UI Components

**ProfilePage** (`src/app/profile/[username]/page.tsx`):
- Server Component for initial data loading
- Fetches profile and content data
- Renders ProfileHeader, ProfileStats, and MediaTabs

**ProfileHeader** (`src/components/profile/ProfileHeader.tsx`):
- Displays banner image with gradient fallback
- Shows avatar, username, and follower counts
- Includes "Editar perfil" button

**ProfileStats** (`src/components/profile/ProfileStats.tsx`):
- Grid of statistic cards showing:
  - Total time (all media)
  - TV shows time
  - Movies time
  - Games time

**MediaTabs** (`src/components/profile/MediaTabs.tsx`):
- Client-side tabs for filtering content
- Main tabs: Series, Películas, Videojuegos
- Sub-tabs: Vistos, Favoritos

**MediaGrid** & **MediaCard** (`src/components/profile/MediaGrid.tsx`):
- Responsive grid layout
- Lazy-loaded images
- Hover effects with overlay information

### Data Flow

```
User visits /profile/username
    ↓
Server Component fetches profile data via repository
    ↓
Repository queries Supabase user_profiles and user_global_stats
    ↓
ProfilePage renders ProfileHeader, ProfileStats, MediaTabs
    ↓
MediaTabs fetches content via TanStack Query (client-side)
    ↓
Content is filtered by media type and status (favorite/watched)
    ↓
MediaGrid renders MediaCard components
```

### API Endpoints

**Profile Edit Page** (`src/app/profile/edit/page.tsx`):
- Client Component for form handling
- Uses TanStack Query mutations for updates
- Validates username availability
- Implements optimistic updates

## Database Schema

### Tables Used

1. **user_profiles**:
   - `id` (PK, FK to auth.users)
   - `first_name`, `last_name`
   - `username` (unique)
   - `avatar_url`, `banner_url`
   - `created_at`, `updated_at`

2. **user_media_tracking**:
   - `user_id` (FK)
   - `media_id` (text, primary key format: "tmdb_*" or "igdb_*")
   - `media_type` ("movie" | "tv" | "game")
   - `is_favorite`, `is_watched`, `is_planned`
   - `progress_minutes`

3. **media** (new table):
   - `id` (PK, MediaId)
   - `type` ("movie" | "tv" | "game")
   - `title`, `original_title`
   - `release_year`, `runtime_minutes`

4. **user_global_stats** (view):
   - Aggregated statistics per user
   - `total_movie_minutes`, `total_tv_minutes`, `total_game_minutes`

## Security

### RLS Policies

1. **user_profiles**:
   - `SELECT`: Public (viewable by everyone)
   - `INSERT`: Only owner can insert their own profile
   - `UPDATE`: Only owner can update their profile

2. **user_global_stats**:
   - Inherits RLS from underlying table `user_media_tracking`

3. **user_media_tracking**:
   - Standard Supabase RLS for user-specific data

### Validation

- Username: Minimum 3 characters, alphanumeric + underscores
- URLs: Valid URL format validation
- Username availability: Checked before update

## Performance Optimizations

1. **Server-side prefetching**:
   - Profile data fetched in Server Component
   - Reduces initial page load time

2. **TanStack Query caching**:
   - 5-minute stale time for profile data
   - 2-minute stale time for content data
   - Automatic refetching on background updates

3. **Image lazy loading**:
   - MediaCard images use `loading="lazy"`
   - Reduces initial bandwidth usage

4. **Database indexes**:
   - `user_media_tracking_user_id_idx`: Fast user queries
   - `user_media_tracking_user_media_type_idx`: Optimized filtering

## Testing Strategy

### Unit Tests
- Domain entity validation
- Repository data mapping
- Component prop types

### Integration Tests
- Profile page rendering
- Tab switching functionality
- Form submission handling

### E2E Tests (Future)
- User profile visit flow
- Profile editing flow
- Username availability validation

## Future Enhancements

1. **Social Features**:
   - Follow/unfollow functionality
   - Follower/following counts
   - Activity feed on profile

2. **Gamification**:
   - Achievement badges display
   - Progress toward milestones
   - Profile level/XP

3. **Content Management**:
   - Direct editing of media status from profile
   - Bulk actions on media lists
   - Export functionality

4. **Privacy Controls**:
   - Private profile option
   - Selective visibility for statistics
   - Block/unblock users

## Files Created/Modified

### New Files
- `src/modules/social/domain/user-profile.repository.ts`
- `src/modules/social/infrastructure/repositories/supabase-user-profile.repository.ts`
- `src/app/profile/[username]/page.tsx`
- `src/app/profile/edit/page.tsx`
- `src/components/profile/ProfileHeader.tsx`
- `src/components/profile/ProfileStats.tsx`
- `src/components/profile/MediaTabs.tsx`
- `src/components/profile/MediaGrid.tsx`
- `src/lib/query-client.tsx`
- `src/lib/supabase.ts`
- `src/modules/social/ui/hooks/use-profile.ts`
- `supabase/migrations/004_media_table.sql`
- `docs/proposals/020-user-profile-view-feature.md`

### Modified Files
- `src/modules/social/domain/user-profile.ts` (added new interfaces)
- `src/modules/shared/domain/media.ts` (added "game" to MediaType)
- `src/app/layout.tsx` (added QueryProvider)

## References

- Proposal: `docs/proposals/020-user-profile-view-feature.md`
- TV Time Profile: https://app.tvtime.com/profile
- Supabase Auth: https://supabase.com/docs/guides/auth
- TanStack Query: https://tanstack.com/query/latest
