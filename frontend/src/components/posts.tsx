import { useEffect, useRef, useState } from 'react'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Paginator, type PaginatorPageChangeEvent} from 'primereact/paginator'
import { useTranslation } from 'react-i18next'
import { postsAPI, type ApiPost, type PostAttachment} from '../services/postAPI'
import { friendsAPI } from '../services/friendsAPI'
import { useAppSelector } from '../store/hooks'
import { store } from '../store/store'
import { notificationsAPI } from '../services/notificationsAPI'
import { translateApiError } from '../services/apiError'

const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024

interface Post {
  id: number
  content: string
  authorId: number
  date: string
  isFromFriend: boolean
  attachment?: PostAttachment | null
}

interface MentionUser {
  id: number
  username: string
  full_name?: string
  avatar_url?: string
}

type FilterType = 'all' | 'my_posts' | 'mentions'

type SortOrder = 'desc' | 'asc'

function parseAttachment(value: unknown): PostAttachment | null {
  if (typeof value !== 'string') {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(value)

    if (
      parsed &&
      typeof parsed === 'object' &&
      'data' in parsed &&
      'name' in parsed &&
      'type' in parsed &&
      typeof parsed.data === 'string' &&
      typeof parsed.name === 'string' &&
      typeof parsed.type === 'string'
    ) {
      return {
        data: parsed.data,
        name: parsed.name,
        type: parsed.type,
      }
    }
  } catch {
    // Older posts stored the raw data URL directly.
  }

  if (value.startsWith('data:')) {
    const type =
      value.slice(5, value.indexOf(';')) ||
      'application/octet-stream'

    return {
      data: value,
      name: 'attachment',
      type,
    }
  }

  return null
}

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
  const currentUser = useAppSelector(
    (state) => state.auth.user,
  )
  const openedProfileId = userId ?? currentUser?.id
  const POSTS_PER_PAGE = 4

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [text, setText] = useState<string>('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [attachment, setAttachment] =
    useState<PostAttachment | null>(null)
  const [imageError, setImageError] = useState<string>('')
  const [first, setFirst] = useState(0)
  const [mentionUsers, setMentionUsers] =
    useState<MentionUser[]>([])
  const [showMentionSuggestions, setShowMentionSuggestions] =
    useState(false)
  const [mentionStart, setMentionStart] =
    useState<number | null>(null)
  const [deletingPostId, setDeletingPostId] =
  useState<number | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    setFirst(event.first)
  }

  const handleTextChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = e.target.value.slice(0, 200)
    const cursorPosition = e.target.selectionStart

    setText(value)

    const textBeforeCursor = value.slice(0, cursorPosition)
    const match = textBeforeCursor.match(
      /(^|\s)@([a-zA-Z0-9._-]*)$/,
    )

    if (!match) {
      setShowMentionSuggestions(false)
      setMentionUsers([])
      setMentionStart(null)
      return
    }

    const query = match[2]

    setMentionStart(
      cursorPosition - query.length - 1,
    )

    try {
      const users = await friendsAPI.searchFriends(query)

      setMentionUsers(users)
      setShowMentionSuggestions(users.length > 0)
    } catch (error) {
      console.error('Error searching friends to mention:', error)

      setMentionUsers([])
      setShowMentionSuggestions(false)
    }
  }

  const handleMentionSelect = (user: MentionUser) => {
    if (mentionStart === null) {
      return
    }

    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    const cursorPosition = textarea.selectionStart
    const beforeMention = text.slice(0, mentionStart)
    const afterMention = text.slice(cursorPosition)
    const mention = `@${user.username}`

    const newText =
      `${beforeMention}${mention} ${afterMention}`.slice(
        0,
        200,
      )

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

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    setImageError('')

    if (file.size > MAX_ATTACHMENT_SIZE) {
      setImageError(
        t('posts_err_image_too_large', {
          maxSize: '2 MB',
          currentSize: (
            file.size /
            1024 /
            1024
          ).toFixed(2),
        }),
      )
      return
    }

    const reader = new FileReader()

    reader.onloadend = () => {
      setAttachment({
        data: reader.result as string,
        name: file.name,
        type:
          file.type || 'application/octet-stream',
      })

      e.target.value = ''
    }

    reader.readAsDataURL(file)
  }

  const handlePost = async () => {
    const content = text.trim()

    if (!content) {
      return
    }

    setImageError('')
    setIsPublishing(true)

    try {
      const createdPost =
        await postsAPI.createPost(
          content,
          attachment,
        )

      const locale =
        i18n.language === 'en'
          ? 'en-US'
          : i18n.language === 'eu'
            ? 'eu-ES'
            : 'es-ES'

      const newPost: Post = {
        id: Number(createdPost.id),
        authorId: currentUser?.id ?? 0,
        content: createdPost.content || content,
        date: createdPost.created_at
          ? new Date(
              createdPost.created_at,
            ).toLocaleString(locale)
          : new Date().toLocaleString(locale),
        isFromFriend: false,
        attachment:
          parseAttachment(
            createdPost.media?.[0],
          ) ?? attachment,
      }

      setPosts((currentPosts) => [
        newPost,
        ...currentPosts,
      ])

      setText('')
      setAttachment(null)
      setImageError('')
      setFirst(0)
      setShowMentionSuggestions(false)
      setMentionUsers([])
      setMentionStart(null)
    } catch (error) {
      setImageError(translateApiError(t, error, 'posts_err_publish'))
    } finally {
      setIsPublishing(false)
    }
  }

const handleDeletePost = async (postId: number) => {
    const confirmed = window.confirm(t('posts_confirm_delete'))

    if (!confirmed) {
      return
    }

    setDeletingPostId(postId)
    setImageError('')

    try {
      await postsAPI.deletePost(postId)

      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId),
      )

      setFirst((currentFirst) => Math.max(0, currentFirst - 1))
    } catch (error) {
      setImageError(translateApiError(t, error, 'posts_err_delete'))
    } finally {
      setDeletingPostId(null)
    }
  }

  
  useEffect(() => {
    let cancelled = false

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

        if (cancelled) {
          return
        }

        const locale =
          i18n.language === 'en'
            ? 'en-US'
            : i18n.language === 'eu'
              ? 'eu-ES'
              : 'es-ES'

        const loadedPosts: Post[] =
          data.map((post: ApiPost) => ({
            id: Number(post.id),
            authorId: Number(post.author_id),
            content: post.content,
            date: post.created_at
              ? new Date(
                  post.created_at,
                ).toLocaleString(locale)
              : '',
            isFromFriend: false,
            attachment: parseAttachment(
              post.media?.[0],
            ),
          }))

        setPosts((currentPosts) => {
          const changed =
            currentPosts.length !==
              loadedPosts.length ||
            currentPosts.some(
              (post, index) =>
                post.id !==
                loadedPosts[index]?.id,
            )

          return changed
            ? loadedPosts
            : currentPosts
        })

        setImageError('')
      } catch (error) {
        if (cancelled) {
          return
        }

        setImageError(translateApiError(t, error, 'posts_err_load'))
      }
    }

    void loadPosts()

    if (
      readOnly ||
      filter === 'mentions'
    ) {
      const interval = setInterval(() => {
        void loadPosts()
      }, 1000)

      return () => {
        cancelled = true
        clearInterval(interval)
      }
    }

    return () => {
      cancelled = true
    }
  }, [
    userId,
    filter,
    readOnly,
    i18n.language,
    t,
  ])

  useEffect(() => {
    if (!openedProfileId) {
      return
    }

    void notificationsAPI.watchProfile(openedProfileId)

    return () => {
      if (store.getState().auth.isAuthenticated) {
        void notificationsAPI.unwatchProfile(openedProfileId)
      }
    }
  }, [openedProfileId])

  const filteredPosts = posts

  const orderedPosts =
    sortOrder === 'asc'
      ? [...filteredPosts].reverse()
      : filteredPosts

  const maxFirst =
    Math.max(
      0,
      Math.floor(
        Math.max(
          filteredPosts.length - 1,
          0,
        ) / POSTS_PER_PAGE,
      ) * POSTS_PER_PAGE,
    )

  const validFirst = Math.min(
    first,
    maxFirst,
  )

  const paginatedPosts =
    orderedPosts.slice(
      validFirst,
      validFirst + POSTS_PER_PAGE,
    )

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
                {t(
                  'posts_content_aria_label',
                )}
              </label>

              <InputTextarea
                id="post-content"
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                rows={3}
                placeholder={t(
                  'posts_textarea_placeholder',
                )}
                className={`w-full post-comment-textarea ${
                  attachment
                    ? 'with-image'
                    : ''
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
                        onMouseDown={(
                          event,
                        ) => {
                          event.preventDefault()
                          handleMentionSelect(
                            user,
                          )
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

              {attachment && (
                <div className="preview-image-container">
                  {attachment.type.startsWith(
                    'image/',
                  ) ? (
                    <img
                      src={attachment.data}
                      alt={t(
                        'posts_preview_image_alt',
                      )}
                      className="preview-image"
                    />
                  ) : (
                    <span className="preview-file">
                      <i
                        className="pi pi-file"
                        aria-hidden="true"
                      />
                      {attachment.name}
                    </span>
                  )}

                  <Button
                    type="button"
                    className="delete-imagen-button"
                    severity="danger"
                    rounded
                    text
                    icon="pi pi-times"
                    aria-label={t(
                      'posts_remove_image_aria_label',
                    )}
                    onClick={() => {
                      setAttachment(null)
                      setImageError('')
                    }}
                  />
                </div>
              )}

              <label
                htmlFor="post-image-upload"
                className="sr-only"
              >
                {t(
                  'posts_upload_aria_label',
                )}
              </label>

              <input
                id="post-image-upload"
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden-file-input"
              />

              <div className="post-actions">
                <Button
                  severity={
                    attachment
                      ? 'success'
                      : 'secondary'
                  }
                  text
                  className="cursor-pointer"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  {attachment
                    ? t(
                        'posts_btn_image_selected',
                      )
                    : t(
                        'posts_btn_add_image',
                      )}
                </Button>

                <Button
                  onClick={() =>
                    void handlePost()
                  }
                  loading={isPublishing}
                  disabled={!text.trim() || isPublishing}
                >
                  {t(
                    'posts_btn_publish',
                  )}
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
                  text={
                    filter !== 'my_posts'
                  }
                >
                  {t(
                    'posts_filter_my_posts',
                  )}
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
                  text={
                    filter !== 'mentions'
                  }
                >
                  {t(
                    'posts_filter_mentions',
                  )}
                </Button>

                <Button
                  onClick={() => {
                    setSortOrder(
                      (currentOrder) =>
                        currentOrder ===
                        'desc'
                          ? 'asc'
                          : 'desc',
                    )
                    setFirst(0)
                  }}
                >
                  {sortOrder === 'desc'
                    ? t(
                        'posts_sort_oldest_first',
                      )
                    : t(
                        'posts_sort_newest_first',
                      )}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="posts-list">
          {filteredPosts.length === 0 && (
            <p className="text-color-secondary text-center">
              {filter === 'mentions'
                ? t(
                    'posts_empty_mentions',
                  )
                : t(
                    'posts_empty_state',
                  )}
            </p>
          )}

          {paginatedPosts.map((post) => (
            <Card
              key={post.id}
              className="w-full"
            >
             <div className="flex justify-content-between align-items-start">
               <p className="texto mt-0 mb-5">
                 {post.content}
               </p>

               {!readOnly &&
                 currentUser?.id === post.authorId && (
                   <Button
                     type="button"
                     icon="pi pi-trash"
                     severity="danger"
                     text
                     rounded
                     loading={deletingPostId === post.id}
                     disabled={deletingPostId !== null}
                     aria-label={t('posts_delete_aria_label')}
                     onClick={() => {
                       void handleDeletePost(post.id)
                     }}
                   />
                 )}
             </div>

              {post.attachment &&
                (post.attachment.type.startsWith(
                  'image/',
                ) ? (
                  <img
                    src={post.attachment.data}
                    alt={t(
                      'posts_image_alt',
                    )}
                    className="post-image"
                  />
                ) : (
                  <a
                    href={
                      post.attachment.data
                    }
                    download={
                      post.attachment.name
                    }
                    className="post-file"
                  >
                    <i
                      className="pi pi-file"
                      aria-hidden="true"
                    />
                    {post.attachment.name}
                  </a>
                ))}

              <p className="fecha text-color-secondary">
                {post.date}
              </p>
            </Card>
          ))}
        </div>

        {filteredPosts.length >
          POSTS_PER_PAGE && (
          <div className="card">
            <Paginator
              first={validFirst}
              rows={POSTS_PER_PAGE}
              totalRecords={
                filteredPosts.length
              }
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