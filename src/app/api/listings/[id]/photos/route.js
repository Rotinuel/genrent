import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const user = await requireAuth(['owner', 'admin'])
    const supabase = getSupabaseAdmin()

    // Verify ownership
    const { data: listing } = await supabase
      .from('generators')
      .select('owner_id, photos')
      .eq('id', id)
      .single()

    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (listing.owner_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const files = formData.getAll('photos')

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadedUrls = []

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const fileName = `generators/${id}/${uuidv4()}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error: uploadError } = await supabase.storage
        .from('genrent-media')
        .upload(fileName, buffer, { contentType: file.type, upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('genrent-media')
        .getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }

    // Append to existing photos
    const photos = [...(listing.photos || []), ...uploadedUrls]
    await supabase.from('generators').update({ photos }).eq('id', id)

    return NextResponse.json({ photos, uploaded: uploadedUrls })
  } catch (err) {
    console.error('[POST /api/listings/[id]/photos]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
