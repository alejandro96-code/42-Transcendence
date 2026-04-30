import { useRef, useState } from 'react'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2 MB

interface Post {
  id: number
  content: string
  date: string
  isFromFriend: boolean
  image?: string | null
}

type FilterType = 'all' | 'my_posts' | 'friends_posts'

interface PostFeedProps {
  readOnly?: boolean
  initialPosts?: Post[]
}

function PostFeed({ readOnly = false, initialPosts = [] }: PostFeedProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [text, setText] = useState<string>('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [image, setImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string>('')

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageError('')

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      setImageError('Solo se permiten imágenes')
      return
    }

    // Validar tamaño (máximo 2 MB)
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(`La imagen es demasiado pesada. Máximo 2 MB (actual: ${(file.size / 1024 / 1024).toFixed(2)} MB)`)
      return
    }

    // Convertir a base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setImage(reader.result as string)
      // Permite seleccionar de nuevo el mismo archivo si el usuario quiere.
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handlePost = () => {
    if (!text.trim()) return
    const newPost: Post = {
      id: Date.now(),
      content: text.trim(),
      date: new Date().toLocaleString(),
      isFromFriend: false,
      image: image || null,
    }
    setPosts((currentPosts) => [newPost, ...currentPosts])
    setText('')
    setImage(null)
    setImageError('')
  }

  const filteredPosts = posts.filter((post) => {
    if (readOnly) return true
    if (filter === 'my_posts') return !post.isFromFriend
    if (filter === 'friends_posts') return post.isFromFriend
    return true
  })

  return (
    <div className='posts-container'>
      <div className="surface-card border-round-sm p-3">
        {!readOnly && (
          <div className="posts-form">
            <h3>Publicar</h3>
            <div className="post-comment">
              <InputTextarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 200))}
                rows={3}
                placeholder="¿Qué quieres compartir?"
                className={`w-full post-comment-textarea ${image ? 'with-image' : ''}`}
                autoResize
                maxLength={200}
              />
              
              <small className="character-counter">
                {text.length}/200
              </small>
              
              {image && (
                <div className="preview-image-container">
                  <img
                    src={image}
                    alt="Preview"
                    className="preview-image"
                  />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden-file-input"
              />

              <div className="post-actions">
                <Button
                  type="button"
                  label={image ? "Imagen seleccionada ✓" : "Añadir imagen"}
                  icon="pi pi-image"
                  severity={image ? 'success' : 'secondary'}
                  text
                  className="cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                />
                <Button label="Publicar" icon="pi pi-send" onClick={handlePost} disabled={!text.trim()} />
              </div>

              {imageError && <small className="image-error">{imageError}</small>}
            </div>
            
            <div className="flex gap-2 mt-4 mb-4">
              <Button
                label="Tus posts"
                onClick={() => setFilter('my_posts')}
                severity={filter === 'my_posts' ? 'info' : 'secondary'}
                text={filter !== 'my_posts'}
              />
              <Button
                label="Posts de amigos"
                onClick={() => setFilter('friends_posts')}
                severity={filter === 'friends_posts' ? 'info' : 'secondary'}
                text={filter !== 'friends_posts'}
              />
            </div>
          </div>
        )}

        {/* Sección de posts - ocupa espacio restante con scroll */}
        <div className="posts-list">
          {filteredPosts.length === 0 && (
            <p className="text-color-secondary text-center">Aún no hay publicaciones.</p>
          )}
          {filteredPosts.map((post) => (
            <Card key={post.id} className="w-full">
              <p className="texto mt-0 mb-5">{post.content}</p>
              {post.image && (
                <img
                  src={post.image}
                  alt="Post image"
                  className="post-image"
                />
              )}
              <p className="fecha text-color-secondary">{post.date}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PostFeed
