import { FieldWrap, SectionCard, fieldClass } from './form-fields'
import type { HotelGuestInput } from '@/features/checkout/types'
import type { RoomGuestCount } from '@/features/stays/utils'

export function HotelGuestsSection({ rooms, guests, errors, onUpdate }: {
  rooms: RoomGuestCount[]
  guests: HotelGuestInput[]
  errors: Record<number, Record<string, string>>
  onUpdate: (index: number, patch: Partial<HotelGuestInput>) => void
}) {
  const starts = rooms.map((_, i) => rooms.slice(0, i).reduce((sum, r) => sum + r.adults + r.children.length, 0))
  return <SectionCard title='Hotel guest details' subtitle='Guest names must match the room occupancy selected for the hotel. The first guest reuses your shared contact information.'>
    <div className='space-y-4'>{rooms.map((room, roomIndex) => {
      const slots = [...Array.from({length: room.adults}, () => ({isChild:false, age:undefined as number|undefined})), ...room.children.map((age)=>({isChild:true,age}))]
      return <div key={roomIndex} className='rounded-xl border border-border bg-muted/30 p-4'>
        <p className='mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-primary'>Room {roomIndex+1} · {room.adults} adult{room.adults===1?'':'s'}{room.children.length ? ` · ${room.children.length} child${room.children.length===1?'':'ren'}` : ''}</p>
        <div className='grid gap-3 sm:grid-cols-2'>{slots.map((slot, localIndex)=>{const index=starts[roomIndex]+localIndex; const guest=guests[index]??{firstName:'',lastName:'',isChild:slot.isChild,age:slot.age}; const err=errors[index]??{}; return <div key={index} className='rounded-lg border border-border bg-background/40 p-3'>
          <div className='mb-2 flex items-center justify-between'><span className='font-mono text-[10px] font-bold text-muted-foreground'>Guest {localIndex+1}</span><span className='rounded-full bg-muted px-2 py-0.5 text-[9px] text-muted-foreground'>{slot.isChild?`Child · ${slot.age} yrs`:'Adult'}</span></div>
          <div className='grid gap-3'><FieldWrap label='First name' error={err.firstName}><input className={fieldClass} value={guest.firstName} onChange={(e)=>onUpdate(index,{firstName:e.target.value,isChild:slot.isChild,age:slot.age})}/></FieldWrap><FieldWrap label='Last name' error={err.lastName}><input className={fieldClass} value={guest.lastName} onChange={(e)=>onUpdate(index,{lastName:e.target.value,isChild:slot.isChild,age:slot.age})}/></FieldWrap></div>
        </div>})}</div>
      </div>
    })}</div>
  </SectionCard>
}
