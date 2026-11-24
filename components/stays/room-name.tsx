import { cn } from '@/lib/utils'

interface RoomNameFields {
  room_name: string
  main_room_type?: string | null
  misc_room_type?: string | null
}

/**
 * A room's name, per the "Citizenship and room name API contract" (section 3):
 * the full `room_name` is what the guest must see before booking, qualifiers
 * included ("smoking", "bed type is subject to availability"…), and it is
 * never truncated.
 *
 * Styled layout: `main_room_type` as the title with `misc_room_type` under it,
 * always visible (no hover, no click). Used only when both parts are there and
 * the full name is made of them; otherwise the full `room_name` is shown as is
 * so nothing it says can be lost.
 */
export function RoomName({
  room,
  className,
  titleClassName,
  detailClassName,
}: {
  room: RoomNameFields
  className?: string
  titleClassName?: string
  detailClassName?: string
}) {
  const full = room.room_name?.trim() ?? ''
  const main = room.main_room_type?.trim()
  const misc = room.misc_room_type?.trim()
  const styled =
    !!main && !!misc && full.includes(main) && full.includes(misc)

  if (!styled) {
    return (
      <div className={className}>
        <p className={cn('break-words', titleClassName)}>{full || main}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <p className={cn('break-words', titleClassName)}>{main}</p>
      <p
        className={cn(
          'mt-0.5 break-words text-[12.5px] font-medium leading-snug text-foreground/75',
          detailClassName,
        )}
      >
        {misc}
      </p>
    </div>
  )
}
