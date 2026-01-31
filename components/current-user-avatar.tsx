'use client'

import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import { useCurrentUserName } from '@/hooks/use-current-user-name'
import { useSpotifyProfile } from '@/hooks/useSpotifyProfile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const CurrentUserAvatar = () => {
  const spotifyProfile = useSpotifyProfile()
  const supabaseImage = useCurrentUserImage()
  const supabaseName = useCurrentUserName()

  const profileImage = spotifyProfile?.image ?? supabaseImage
  const name = spotifyProfile?.display_name ?? supabaseName
  const initials = name
    ?.split(' ')
    ?.map((word) => word[0])
    ?.join('')
    ?.toUpperCase()

  return (
    <Avatar>
      {profileImage && <AvatarImage src={profileImage} alt={initials} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
