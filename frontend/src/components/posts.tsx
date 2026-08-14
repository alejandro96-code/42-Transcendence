import { useEffect, useRef, useState } from 'react'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Paginator, type PaginatorPageChangeEvent } from 'primereact/paginator'
import { postsAPI } from '../services/postAPI'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2 MB

interface Post {
  id: number
  content: string
  date: string
  isFromFriend: boolean
  image?: string | null
}

type FilterType = 'all' | 'my_posts' | 'friends_posts'
type SortOrder = 'desc' | 'asc'

interface PostFeedProps {
  readOnly?: boolean
  initialPosts?: Post[]
}

export function PostFeed({ readOnly = false, initialPosts = [] }: PostFeedProps) {
  const POSTS_PER_PAGE = 4
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [text, setText] = useState<string>('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [image, setImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string>('')
  const [first, setFirst] = useState(0)

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    setFirst(event.first)
  }

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

const handlePost = async () => {
  const content = text.trim()

  if (!content) return

  try {
    const createdPost = await postsAPI.createPost(content)

    const newPost: Post = {
      id: Number(createdPost[0]?.id ?? createdPost.id),
      content: createdPost[0]?.content ?? createdPost.content ?? content,
      date: createdPost[0]?.created_at
        ? new Date(createdPost[0].created_at).toLocaleString()
        : new Date().toLocaleString(),
      isFromFriend: false,
      image: image || null,
    }

    setPosts((currentPosts) => [newPost, ...currentPosts])
    setText('')
    setImage(null)
    setImageError('')
    setFirst(0)
  } catch (error) {
    console.error('Error al crear el post:', error)

    if (error instanceof Error) {
      setImageError(error.message)
    } else {
      setImageError('No se pudo publicar el post.')
    }
  }
}

  const filteredPosts = posts.filter((post) => {
    if (readOnly) return true
    if (filter === 'my_posts') return !post.isFromFriend
    if (filter === 'friends_posts') return post.isFromFriend
    return true
  })
  const orderedPosts = sortOrder === 'asc' ? [...filteredPosts].reverse() : filteredPosts
  const paginatedPosts = orderedPosts.slice(first, first + POSTS_PER_PAGE)

  useEffect(() => {
  const loadPosts = async () => {
    try {
      const data = await postsAPI.getPosts()

      const loadedPosts: Post[] = data.map((post: any) => ({
        id: Number(post.id),
        content: post.content,
        date: post.created_at
          ? new Date(post.created_at).toLocaleString()
          : '',
        isFromFriend: false,
        image: null,
      }))

      setPosts(loadedPosts)
    } catch (error) {
      console.error('Error cargando los posts:', error)
    }
  }

  loadPosts()
}, [])

  useEffect(() => {
    const lastValidFirst = Math.max(0, Math.floor((Math.max(filteredPosts.length - 1, 0)) / POSTS_PER_PAGE) * POSTS_PER_PAGE)
    if (first > lastValidFirst) {
      setFirst(lastValidFirst)
    }
  }, [filteredPosts.length, first, POSTS_PER_PAGE])

  return (
    <div className='posts-container'>
      <div className="surface-card border-round-sm p-3">
        {!readOnly && (
          <div className="posts-form">
            <div className="post-comment">
              <label htmlFor="post-content" className="sr-only">Contenido de la publicación</label>
              <InputTextarea
                id="post-content"
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

              <label htmlFor="post-image-upload" className="sr-only">Añadir imagen a la publicación</label>
              <input
                id="post-image-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden-file-input"
              />

              <div className="post-actions">
                <Button
                  severity={image ? 'success' : 'secondary'}
                  text
                  className="cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                > {image ? "Imagen seleccionada ✓" : "Añadir imagen"}
                </Button>
                <Button
                onClick={handlePost}
                disabled={!text.trim()}
                > Publicar
                </Button>
              </div>

              {imageError && <small className="image-error">{imageError}</small>}
            </div>
            
            <div className="flex gap-2 mt-4 mb-4">
              <Button
                onClick={() => setFilter('my_posts')}
                severity={filter === 'my_posts' ? 'info' : 'secondary'}
                text={filter !== 'my_posts'}
              > Tus posts
              </Button>
              <Button
                onClick={() => setFilter('friends_posts')}
                severity={filter === 'friends_posts' ? 'info' : 'secondary'}
                text={filter !== 'friends_posts'}
              > Menciones
              </Button>
              <Button
                onClick={() => {
                  setSortOrder((currentOrder) => (currentOrder === 'desc' ? 'asc' : 'desc'))
                  setFirst(0)
                }}
              > {sortOrder === 'desc' ? '+ antiguo primero' : '+ reciente primero'}
              </Button>
            </div>
          </div>
        )}

        {/* Sección de posts - ocupa espacio restante con scroll */}
        <div className="posts-list">
          {filteredPosts.length === 0 && (
            <p className="text-color-secondary text-center">Aún no hay publicaciones.</p>
          )}
          {paginatedPosts.map((post) => (
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
        {filteredPosts.length > POSTS_PER_PAGE && (
          <div className="card">
            <Paginator
              first={first}
              rows={POSTS_PER_PAGE}
              totalRecords={filteredPosts.length}
              onPageChange={onPageChange}
              template={{ layout: 'PrevPageLink CurrentPageReport NextPageLink' }}
              className="post-paginator"
              />
          </div>
        )}
      </div>
    </div>
  )
}