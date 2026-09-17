import { useEffect, useRef, useState } from 'react'
import { InputTextarea } from 'primereact/inputtextarea'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Dropdown } from 'primereact/dropdown'
import { Paginator, type PaginatorPageChangeEvent} from 'primereact/paginator'
import { useTranslation } from 'react-i18next'
import { postsAPI, type ApiPost, type PostAttachment} from '../services/postAPI'
import { friendsAPI } from '../services/friendsAPI'
import { useAppSelector } from '../store/hooks'
import { translateApiError } from '../services/apiError'
import { EmptyState } from './ui/EmptyState'
import { FormField } from './ui/FormField'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { StatPill } from './ui/StatPill'

const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024

const ACCEPTED_ATTACHMENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
]

const ACCEPTED_ATTACHMENT_EXTENSIONS =
  '.png,.jpg,.jpeg,.webp,.gif,.pdf,.doc,.docx,.txt,.csv'

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

function localeFor(language: string): string {
  return language === 'en' ? 'en-US' : language === 'eu' ? 'eu-ES' : 'es-ES'
}

function mapApiPostToPost(post: ApiPost, locale: string): Post {
  return {
    id: Number(post.id),
    authorId: Number(post.author_id),
    content: post.content,
    date: post.created_at
      ? new Date(post.created_at).toLocaleString(locale)
      : '',
    isFromFriend: false,
    attachment: parseAttachment(post.media?.[0]),
  }
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
  const POSTS_PER_PAGE = 4

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [text, setText] = useState<string>('')
  const [filter, setFilter] = useState<FilterType>('all')
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
  const [editingPostId, setEditingPostId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const SEARCH_PAGE_SIZE = 5
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchAuthor, setSearchAuthor] = useState('')
  const [searchAttachment, setSearchAttachment] =
    useState<'any' | 'yes' | 'no'>('any')
  const [searchDateFrom, setSearchDateFrom] = useState('')
  const [searchDateTo, setSearchDateTo] = useState('')
  const [searchSort, setSearchSort] =
    useState<'newest' | 'oldest'>('newest')
  const [searchResults, setSearchResults] = useState<Post[] | null>(null)
  const [searchPage, setSearchPage] = useState(1)
  const [searchTotal, setSearchTotal] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const isSearchActive = searchResults !== null

  const runSearch = async (page: number) => {
    setIsSearching(true)
    setSearchError('')

    try {
      const result = await postsAPI.searchPosts({
        q: searchQuery.trim() || undefined,
        author: searchAuthor.trim() || undefined,
        hasAttachment:
          searchAttachment === 'any'
            ? undefined
            : searchAttachment === 'yes',
        dateFrom: searchDateFrom || undefined,
        dateTo: searchDateTo || undefined,
        sort: searchSort,
        page,
        pageSize: SEARCH_PAGE_SIZE,
      })

      const locale = localeFor(i18n.language)

      setSearchResults(
        result.results.map((post) => mapApiPostToPost(post, locale)),
      )
      setSearchPage(result.page)
      setSearchTotal(result.total)
    } catch (error) {
      setSearchError(translateApiError(t, error, 'posts_search_error'))
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchSubmit = () => {
    void runSearch(1)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
    setSearchAuthor('')
    setSearchAttachment('any')
    setSearchDateFrom('')
    setSearchDateTo('')
    setSearchSort('newest')
    setSearchResults(null)
    setSearchTotal(0)
    setSearchPage(1)
    setSearchError('')
  }

  const onSearchPageChange = (event: PaginatorPageChangeEvent) => {
    void runSearch(Math.floor(event.first / SEARCH_PAGE_SIZE) + 1)
  }

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

    if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type)) {
      setImageError(t('posts_err_attachment_invalid_type'))
      e.target.value = ''
      return
    }

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
      e.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onloadend = () => {
      setAttachment({
        data: reader.result as string,
        name: file.name,
        type: file.type,
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

      const newPost: Post = {
        ...mapApiPostToPost(createdPost, localeFor(i18n.language)),
        authorId: currentUser?.id ?? 0,
        attachment:
          parseAttachment(createdPost.media?.[0]) ?? attachment,
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

  const handleStartEdit = (post: Post) => {
    setEditingPostId(post.id)
    setEditContent(post.content)
    setImageError('')
  }

  const handleCancelEdit = () => {
    setEditingPostId(null)
    setEditContent('')
  }

  const handleSaveEdit = async (postId: number) => {
    const content = editContent.trim()

    if (!content) {
      return
    }

    setIsSavingEdit(true)

    try {
      const updatedPost = await postsAPI.updatePost(postId, content)
      const locale = localeFor(i18n.language)
      const mappedPost = mapApiPostToPost(updatedPost, locale)

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId ? { ...post, content: mappedPost.content } : post,
        ),
      )

      setSearchResults((currentResults) =>
        currentResults
          ? currentResults.map((post) =>
              post.id === postId
                ? { ...post, content: mappedPost.content }
                : post,
            )
          : currentResults,
      )

      setEditingPostId(null)
      setEditContent('')
    } catch (error) {
      setImageError(translateApiError(t, error, 'posts_err_update'))
    } finally {
      setIsSavingEdit(false)
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

        const locale = localeFor(i18n.language)

        const loadedPosts: Post[] =
          data.map((post: ApiPost) => mapApiPostToPost(post, locale))

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

  const filteredPosts = posts

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
    filteredPosts.slice(
      validFirst,
      validFirst + POSTS_PER_PAGE,
    )

  const renderPostCard = (post: Post) => {
    const isEditing = editingPostId === post.id
    const isOwnPost = !readOnly && currentUser?.id === post.authorId

    return (
      <Card key={post.id} className="w-full">
        <div className="flex justify-content-between align-items-start">
          {isEditing ? (
            <FormField
              id={`edit-post-${post.id}`}
              label={t('posts_content_aria_label')}
              hideLabel
              className="w-full mb-3"
            >
              <InputTextarea
                id={`edit-post-${post.id}`}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value.slice(0, 200))}
                rows={3}
                maxLength={200}
                autoFocus
                className="w-full"
              />
            </FormField>
          ) : (
            <p className="texto mt-0 mb-5">{post.content}</p>
          )}

          {isOwnPost && !isEditing && (
            <div className="flex gap-1">
              <Button
                type="button"
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                disabled={deletingPostId !== null}
                aria-label={t('posts_edit_aria_label')}
                onClick={() => handleStartEdit(post)}
              />

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
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex justify-content-end gap-2 mb-3">
            <Button
              type="button"
              label={t('posts_edit_cancel')}
              severity="secondary"
              text
              disabled={isSavingEdit}
              onClick={handleCancelEdit}
            />

            <Button
              type="button"
              label={t('posts_edit_save')}
              loading={isSavingEdit}
              disabled={!editContent.trim()}
              onClick={() => void handleSaveEdit(post.id)}
            />
          </div>
        )}

        {post.attachment &&
          (post.attachment.type.startsWith('image/') ? (
            <img
              src={post.attachment.data}
              alt={t('posts_image_alt')}
              className="post-image"
            />
          ) : (
            <a
              href={post.attachment.data}
              download={post.attachment.name}
              className="post-file"
            >
              <i className="pi pi-file" aria-hidden="true" />
              {post.attachment.name}
            </a>
          ))}

        <p className="fecha text-color-secondary">{post.date}</p>
      </Card>
    )
  }

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
                accept={ACCEPTED_ATTACHMENT_EXTENSIONS}
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
                  onClick={() => setIsSearchOpen((open) => !open)}
                  severity={isSearchOpen ? 'info' : 'secondary'}
                  text={!isSearchOpen}
                >
                  {t('posts_search_toggle')}
                </Button>
              </div>
            )}

            {!readOnly && isSearchOpen && (
              <div className="posts-search-panel surface-100 border-round-sm p-3 mb-4">
                <div className="grid formgrid">
                  <div className="col-12 md:col-6">
                    <FormField id="search-q" label={t('posts_search_query_label')}>
                      <InputText
                        id="search-q"
                        className="w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('posts_search_query_placeholder')}
                      />
                    </FormField>
                  </div>

                  <div className="col-12 md:col-6">
                    <FormField id="search-author" label={t('posts_search_author_label')}>
                      <InputText
                        id="search-author"
                        className="w-full"
                        value={searchAuthor}
                        onChange={(e) => setSearchAuthor(e.target.value)}
                        placeholder={t('posts_search_author_placeholder')}
                      />
                    </FormField>
                  </div>

                  <div className="col-12 md:col-4">
                    <label htmlFor="search-attachment" className="text-sm">
                      {t('posts_search_attachment_label')}
                    </label>
                    <Dropdown
                      inputId="search-attachment"
                      name="search-attachment"
                      className="w-full"
                      value={searchAttachment}
                      onChange={(e) => setSearchAttachment(e.value)}
                      options={[
                        { label: t('posts_search_attachment_any'), value: 'any' },
                        { label: t('posts_search_attachment_yes'), value: 'yes' },
                        { label: t('posts_search_attachment_no'), value: 'no' },
                      ]}
                    />
                  </div>

                  <div className="col-6 md:col-2">
                    <label htmlFor="search-date-from" className="text-sm">
                      {t('posts_search_date_from_label')}
                    </label>
                    <input
                      id="search-date-from"
                      type="date"
                      className="w-full p-inputtext p-component"
                      value={searchDateFrom}
                      onChange={(e) => setSearchDateFrom(e.target.value)}
                    />
                  </div>

                  <div className="col-6 md:col-2">
                    <label htmlFor="search-date-to" className="text-sm">
                      {t('posts_search_date_to_label')}
                    </label>
                    <input
                      id="search-date-to"
                      type="date"
                      className="w-full p-inputtext p-component"
                      value={searchDateTo}
                      onChange={(e) => setSearchDateTo(e.target.value)}
                    />
                  </div>

                  <div className="col-12 md:col-4">
                    <label htmlFor="search-sort" className="text-sm">
                      {t('posts_search_sort_label')}
                    </label>
                    <Dropdown
                      inputId="search-sort"
                      name="search-sort"
                      className="w-full"
                      value={searchSort}
                      onChange={(e) => setSearchSort(e.value)}
                      options={[
                        { label: t('posts_sort_newest_first'), value: 'newest' },
                        { label: t('posts_sort_oldest_first'), value: 'oldest' },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleSearchSubmit}
                    loading={isSearching}
                  >
                    {t('posts_search_submit')}
                  </Button>

                  {isSearchActive && (
                    <Button
                      severity="secondary"
                      outlined
                      onClick={handleSearchClear}
                    >
                      {t('posts_search_clear')}
                    </Button>
                  )}
                </div>

                {searchError && (
                  <small className="image-error">{searchError}</small>
                )}
              </div>
            )}
          </div>
        )}

        {isSearchActive ? (
          <>
            <div className="posts-list">
              <StatPill>
                {t('posts_search_results_count', { count: searchTotal })}
              </StatPill>

              {isSearching ? (
                <LoadingSpinner label={t('header_search_loading')} />
              ) : (
                searchResults.length === 0 && (
                  <EmptyState icon="pi pi-search" message={t('posts_search_no_results')} />
                )
              )}

              {searchResults.map(renderPostCard)}
            </div>

            {searchTotal > SEARCH_PAGE_SIZE && (
              <div className="card">
                <Paginator
                  first={(searchPage - 1) * SEARCH_PAGE_SIZE}
                  rows={SEARCH_PAGE_SIZE}
                  totalRecords={searchTotal}
                  onPageChange={onSearchPageChange}
                  template={{
                    layout: 'PrevPageLink CurrentPageReport NextPageLink',
                  }}
                  className="post-paginator"
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="posts-list">
              {filteredPosts.length === 0 && (
                <EmptyState
                  icon={filter === 'mentions' ? 'pi pi-at' : 'pi pi-inbox'}
                  message={
                    filter === 'mentions'
                      ? t('posts_empty_mentions')
                      : t('posts_empty_state')
                  }
                />
              )}

              {paginatedPosts.map(renderPostCard)}
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
          </>
        )}
      </div>
    </div>
  )
}