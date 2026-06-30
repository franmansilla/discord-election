import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "No autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) return Response.json({ error: "No se envió archivo" }, { status: 400 })

  const maxSize = 5 * 1024 * 1024 // 5 MB
  if (file.size > maxSize) return Response.json({ error: "El archivo no puede superar 5 MB" }, { status: 400 })

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowed.includes(file.type)) {
    return Response.json({ error: "Solo se permiten imágenes JPG, PNG, WEBP o GIF" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const filename = `${session.user.id}-${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error } = await supabase.storage
    .from("campaign-images")
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (error) {
    console.error("Supabase upload error:", error)
    return Response.json({ error: "Error al subir la imagen" }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from("campaign-images")
    .getPublicUrl(filename)

  return Response.json({ url: publicUrl })
}
