import { useState } from 'react'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'

interface Post {
  id: number
  content: string
  date: string
  isFromFriend: boolean
  image?: string | null
}

type FilterType = 'all' | 'my_posts' | 'friends_posts'

function PostFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [text, setText] = useState<string>('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [image, setImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string>('')

  const MIN_SIZE = 2 * 1024 * 1024 // 2 MB
  const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageError('')

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      setImageError('Solo se permiten imágenes')
      return
    }

    // Validar tamaño
    if (file.size < MIN_SIZE || file.size > MAX_SIZE) {
      setImageError(`La imagen debe pesar entre 2 MB y 5 MB (actual: ${(file.size / 1024 / 1024).toFixed(2)} MB)`)
      return
    }

    // Convertir a base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setImage(reader.result as string)
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
    setPosts([newPost, ...posts])
    setText('')
    setImage(null)
    setImageError('')
  }

  const filteredPosts = posts.filter((post) => {
    if (filter === 'my_posts') return !post.isFromFriend
    if (filter === 'friends_posts') return post.isFromFriend
    return true
  })

  return (
    <div className='posts-container'>
      <div className="surface-card border-round-sm p-3">
        <h3 className="mt-0 mb-3">Publicar</h3>
        <InputTextarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 200))}
          rows={3}
          placeholder="¿Qué quieres compartir?"
          className="w-full mb-2"
          autoResize
          maxLength={200}
        />
        
        <div className="mb-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
            id="image-input"
          />
          <label htmlFor="image-input">
            <Button
              label={image ? "Imagen seleccionada ✓" : "Añadir imagen (2-5 MB)"}
              icon="pi pi-image"
              onClick={() => document.getElementById('image-input')?.click()}
              severity={image ? 'success' : 'secondary'}
              text
              className="cursor-pointer"
            />
          </label>
          {imageError && <small className="text-red-500 block mt-2">{imageError}</small>}
          {image && <small className="text-green-600 block mt-2">Imagen lista para publicar</small>}
        </div>

        <div className="flex justify-content-between align-items-center mb-4">
          <small className="text-color-secondary">{text.length}/200</small>
          <Button label="Publicar" icon="pi pi-send" onClick={handlePost} disabled={!text.trim()} />
        </div>
        
        <div className="flex gap-2 mb-4">
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

        <div className="flex flex-column gap-3">
          {filteredPosts.length === 0 && (
            <p className="text-color-secondary text-center">Aún no hay publicaciones.</p>
          )}
          {filteredPosts.map((post) => (
            <Card key={post.id} className="w-full">
              {post.image && (
                <img
                  src={post.image}
                  alt="Post image"
                  style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '1rem' }}
                />
              )}
              <p className="texto mt-0 mb-5">{post.content}</p>
              <small className="fecha text-color-secondary">{post.date}</small>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PostFeed
