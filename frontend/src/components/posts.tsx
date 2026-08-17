import { useEffect, useRef, useState } from 'react'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Paginator, type PaginatorPageChangeEvent } from 'primereact/paginator'
import { useTranslation } from 'react-i18next'
import { postsAPI } from '../services/postAPI'
import { friendsAPI } from '../services/friendsAPI'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2 MB

interface Post {
  id: number
  content: string
  date: string
  isFromFriend: boolean
  image?: string | null
}

interface MentionUser {
  id: number
  username: string
  full_name?: string
  avatar_url?: string
}

type FilterType = 'all' | 'my_posts' | 'mentions'
type SortOrder = 'desc' | 'asc'

interface PostFeedProps {
  readOnly?: boolean
  initialPosts?: Post[]
  userId?: number
}

export function PostFeed({
  readOnly = false,
  initialPosts = [],
  userId,
}: PostFeedProps) {
  const { t, i18n } = useTranslation()
  const POSTS_PER_PAGE = 4

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [text, setText] = useState<string>('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const [image, setImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string>('')
  const [first, setFirst] = useState(0)

  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([])
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionStart, setMentionStart] = useState<number | null>(null)

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    setFirst(event.first)
  }

  /*
   * Detecta si el usuario está escribiendo una mención.
   *
   * Ejemplos:
   *   "@"
   *   "@ale"
   *   "Hola @ale"
   *
   * Solo se buscan amigos mediante friendsAPI.searchFriends().
   */
  const handleTextChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = e.target.value.slice(0, 200)
    const cursorPosition = e.target.selectionStart

    setText(value)

    const textBeforeCursor = value.slice(0, cursorPosition)

    const match = textBeforeCursor.match(/(^|\s)@([a-zA-Z0-9._-]*)$/)

    if (!match) {
      setShowMentionSuggestions(false)
      setMentionUsers([])
      setMentionStart(null)
      return
    }

    const query = match[2]

    setMentionStart(cursorPosition - query.length - 1)

    try {
      const users = await friendsAPI.searchFriends(query)

      setMentionUsers(users)
      setShowMentionSuggestions(users.length > 0)
    } catch (error) {
      console.error('Error buscando amigos para mencionar:', error)

      setMentionUsers([])
      setShowMentionSuggestions(false)
    }
  }

  /*
   * Inserta la mención seleccionada en la posición donde estaba @texto.
   */
  const handleMentionSelect = (user: MentionUser) => {
    if (mentionStart === null) return

    const textarea = textareaRef.current

    if (!textarea) return

    const cursorPosition = textarea.selectionStart

    const beforeMention = text.slice(0, mentionStart)
    const afterMention = text.slice(cursorPosition)

    const mention = `@${user.username}`

    const newText = `${beforeMention}${mention} ${afterMention}`.slice(0, 200)

    setText(newText)
    setShowMentionSuggestions(false)
    setMentionUsers([])
    setMentionStart(null)

    requestAnimationFrame(() => {
      const newCursorPosition =
        beforeMention.length + mention.length + 1

      textarea.focus()
      textarea.setSelectionRange(
        newCursorPosition,
        newCursorPosition,
      )
    })
  }

  /*
   * Selección de imagen.
   */
  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]

    if (!file) return

    setImageError('')

    if (!file.type.startsWith('image/')) {
      setImageError(t('posts_err_not_an_image'))
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(
        t('posts_err_image_too_large', {
          maxSize: '2 MB',
          currentSize: (file.size / 1024 / 1024).toFixed(2),
        }),
      )
      return
    }

    const reader = new FileReader()

    reader.onloadend = () => {
      setImage(reader.result as string)

      // Permite volver a seleccionar el mismo archivo.
      e.target.value = ''
    }

    reader.readAsDataURL(file)
  }

  /*
   * Crear publicación.
   */
  const handlePost = async () => {
    const content = text.trim()

    if (!content) return

    setImageError('')

    try {
      const createdPost = await postsAPI.createPost(content, image)

      const locale =
        i18n.language === 'en'
          ? 'en-US'
          : i18n.language === 'eu'
            ? 'eu-ES'
            : 'es-ES'

      const newPost: Post = {
        id: Number(
          createdPost[0]?.id ?? createdPost.id,
        ),
        content:
          createdPost[0]?.content ??
          createdPost.content ??
          content,
        date: createdPost[0]?.created_at
          ? new Date(
              createdPost[0].created_at,
            ).toLocaleString(locale)
          : new Date().toLocaleString(locale),
        isFromFriend: false,
        image:
          createdPost[0]?.media?.[0] ??
          image ??
          null,
      }

      setPosts((currentPosts) => [
        newPost,
        ...currentPosts,
      ])

      setText('')
      setImage(null)
      setImageError('')
      setFirst(0)

      setShowMentionSuggestions(false)
      setMentionUsers([])
      setMentionStart(null)
    } catch (error) {
      if (error instanceof Error) {
        setImageError(error.message)
      } else {
        setImageError(t('posts_err_publish'))
      }
    }
  }

  /*
   * Cargar publicaciones.
   *
   * En un perfil propio:
   *   GET /api/posts
   *
   * En el perfil de un amigo:
   *   GET /api/posts?user=ID
   *
   * En "Menciones":
   *   GET /api/posts?filter=mentions
   */
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const postFilter =
          !readOnly && filter === 'mentions'
            ? 'mentions'
            : undefined

        const data = await postsAPI.getPosts(
          userId,
          postFilter,
        )

        const locale =
          i18n.language === 'en'
            ? 'en-US'
            : i18n.language === 'eu'
              ? 'eu-ES'
              : 'es-ES'

        const loadedPosts: Post[] = data.map(
          (post: any) => ({
            id: Number(post.id),
            content: post.content,
            date: post.created_at
              ? new Date(
                  post.created_at,
                ).toLocaleString(locale)
              : '',
            isFromFriend: false,
            image: post.media?.[0] ?? null,
          }),
        )

        setPosts(loadedPosts)
        setFirst(0)
      } catch (error) {
        if (error instanceof Error) {
          setImageError(error.message)
        } else {
          setImageError(t('posts_err_load'))
        }

        setPosts([])
      }
    }

    void loadPosts()
  }, [userId, filter, readOnly, i18n.language])

  /*
   * Los posts ya vienen filtrados desde el backend.
   *
   * Por eso no filtramos aquí por "mentions".
   */
  const filteredPosts = posts

  const orderedPosts =
    sortOrder === 'asc'
      ? [...filteredPosts].reverse()
      : filteredPosts

  const paginatedPosts = orderedPosts.slice(
    first,
    first + POSTS_PER_PAGE,
  )

  /*
   * Mantener la página actual válida cuando cambia
   * el número de publicaciones.
   */
  useEffect(() => {
    const lastValidFirst = Math.max(
      0,
      Math.floor(
        Math.max(filteredPosts.length - 1, 0) /
          POSTS_PER_PAGE,
      ) * POSTS_PER_PAGE,
    )

    if (first > lastValidFirst) {
      setFirst(lastValidFirst)
    }
  }, [
    filteredPosts.length,
    first,
    POSTS_PER_PAGE,
  ])

  return (
    <div className="posts-container">
      <div className="surface-card border-round-sm p-3">

        {!readOnly && (
          <div className="posts-form">

            <div className="post-comment">

              <label
                htmlFor="post-content"
                className="sr-only"
              >
                {t('posts_content_aria_label')}
              </label>

              <InputTextarea
                id="post-content"
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                rows={3}
                placeholder={t('posts_textarea_placeholder')}
                className={`w-full post-comment-textarea ${
                  image ? 'with-image' : ''
                }`}
                autoResize
                maxLength={200}
              />

              {showMentionSuggestions &&
                mentionUsers.length > 0 && (
                  <div className="mention-suggestions">
                    {mentionUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="mention-suggestion"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          handleMentionSelect(user)
                        }}
                      >
                        <div className="mention-user-info">
                          <span className="mention-username">
                            @{user.username}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              <small className="character-counter">
                {text.length}/200
              </small>

              {image && (
                <div className="preview-image-container">
                  <img
                    src={image}
                    alt={t('posts_preview_image_alt')}
                    className="preview-image"
                  />

                  <Button
                    type="button"
                    className="delete-imagen-button"
                    severity="danger"
                    rounded
                    text
                    icon="pi pi-times"
                    aria-label={t('posts_remove_image_aria_label')}
                    onClick={() => {
                      setImage(null)
                      setImageError('')
                    }}
                  />
                </div>
              )}

              <label
                htmlFor="post-image-upload"
                className="sr-only"
              >
                {t('posts_upload_aria_label')}
              </label>

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
                  severity={
                    image ? 'success' : 'secondary'
                  }
                  text
                  className="cursor-pointer"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  {image
                    ? t('posts_btn_image_selected')
                    : t('posts_btn_add_image')}
                </Button>

                <Button
                  onClick={handlePost}
                  disabled={!text.trim()}
                >
                  {t('posts_btn_publish')}
                </Button>
              </div>

              {imageError && (
                <small className="image-error">
                  {imageError}
                </small>
              )}
            </div>

            {!readOnly && (
              <div className="flex gap-2 mt-4 mb-4">

                <Button
                  onClick={() => {
                    setFilter('my_posts')
                    setFirst(0)
                  }}
                  severity={
                    filter === 'my_posts'
                      ? 'info'
                      : 'secondary'
                  }
                  text={filter !== 'my_posts'}
                >
                  {t('posts_filter_my_posts')}
                </Button>

                <Button
                  onClick={() => {
                    setFilter('mentions')
                    setFirst(0)
                  }}
                  severity={
                    filter === 'mentions'
                      ? 'info'
                      : 'secondary'
                  }
                  text={filter !== 'mentions'}
                >
                  {t('posts_filter_mentions')}
                </Button>

                <Button
                  onClick={() => {
                    setSortOrder(
                      (currentOrder) =>
                        currentOrder === 'desc'
                          ? 'asc'
                          : 'desc',
                    )
                    setFirst(0)
                  }}
                >
                  {sortOrder === 'desc'
                    ? t('posts_sort_oldest_first')
                    : t('posts_sort_newest_first')}
                </Button>

              </div>
            )}

          </div>
        )}

        {/* Lista de publicaciones */}
        <div className="posts-list">

          {filteredPosts.length === 0 && (
            <p className="text-color-secondary text-center">
              {filter === 'mentions'
                ? t('posts_empty_mentions')
                : t('posts_empty_state')}
            </p>
          )}

          {paginatedPosts.map((post) => (
            <Card
              key={post.id}
              className="w-full"
            >
              <p className="texto mt-0 mb-5">
                {post.content}
              </p>

              {post.image && (
                <img
                  src={post.image}
                  alt={t('posts_image_alt')}
                  className="post-image"
                />
              )}

              <p className="fecha text-color-secondary">
                {post.date}
              </p>
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
              template={{
                layout:
                  'PrevPageLink CurrentPageReport NextPageLink',
              }}
              className="post-paginator"
            />
          </div>
        )}

      </div>
    </div>
  )
}