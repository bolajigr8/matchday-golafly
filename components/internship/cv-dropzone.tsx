'use client'

import * as React from 'react'
import { FileText, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CV_ACCEPT } from '@/schema/internship'

/* Single-file CV picker: drag-and-drop or browse. It only reports the chosen
   file; type and size are validated by the form's zod schema, so the error
   message shows in the same place as every other field error. */
export function CvDropzone({
  value,
  onChange,
  invalid,
}: {
  value?: File
  onChange: (file: File | undefined) => void
  invalid?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  if (value) {
    return (
      <div className='flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3'>
        <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-brand-text'>
          <FileText className='size-5' />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-sm font-semibold text-foreground'>{value.name}</span>
          <span className='block text-xs text-muted-foreground'>
            {formatSize(value.size)} {invalid ? '' : '· ready to send'}
          </span>
        </span>
        <button
          type='button'
          onClick={() => {
            onChange(undefined)
            if (inputRef.current) inputRef.current.value = ''
          }}
          className='inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-brand-text/50'
        >
          <X className='size-3.5' />
          Remove
        </button>
      </div>
    )
  }

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) onChange(file)
      }}
      className={cn(
        'grid justify-items-center gap-2.5 rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-colors',
        dragging ? 'border-brand-text bg-primary/15' : 'border-brand-text/35 bg-primary/5',
        invalid && !dragging && 'border-destructive/60',
      )}
    >
      <span className='grid size-12 place-items-center rounded-xl bg-primary/15 text-brand-text'>
        <Upload className='size-5' />
      </span>
      <p className='text-[15px] font-semibold text-foreground'>
        <span className='hidden sm:inline'>Drag your CV here</span>
        <span className='sm:hidden'>Upload your CV</span>
      </p>
      <p className='text-xs text-muted-foreground'>
        <span className='hidden sm:inline'>or </span>
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          className='font-semibold text-brand-text underline underline-offset-3'
        >
          browse files
        </button>{' '}
        · PDF, DOC or DOCX · max 5 MB
      </p>
      <input
        ref={inputRef}
        type='file'
        accept={CV_ACCEPT}
        className='hidden'
        onChange={(e) => onChange(e.target.files?.[0])}
      />
    </div>
  )
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}
