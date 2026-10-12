import { useCallback, useEffect, useState } from 'react'
import {
  Flag, Heart, Leaf, MessageCircle, Pencil, Plus, Search, Send, Sprout, Trash2, Users,
} from 'lucide-react'
import { api, formatRelative } from '../lib/api'
import { EmptyState, ErrorBanner, Modal, Skeleton } from '../components/common'

const PAGE_SIZE = 10

const REACTIONS = [
  { type: 'support', label: 'Support', icon: Heart },
  { type: 'relate', label: 'I relate', icon: Users },
  { type: 'grow', label: 'Helped me grow', icon: Sprout },
]

export default function Forum() {
  const [rooms, setRooms] = useState([])
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [sort, setSort] = useState('newest')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)

  const [editing, setEditing] = useState(null)

  const fetchPosts = useCallback(async (offset = 0) => {
    const params = new URLSearchParams()
    if (roomId) params.set('roomId', roomId)
    if (search) params.set('q', search)
    params.set('sort', sort)
    params.set('limit', String(PAGE_SIZE))
    params.set('offset', String(offset))
    const data = await api(`/forum/posts?${params.toString()}`)
    setTotal(data.total)
    setHasMore(data.hasMore)
    setPosts(list => offset === 0 ? data.posts : [...list, ...data.posts])
  }, [roomId, search, sort])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    fetchPosts(0).catch(err => alive && setError(err.message)).finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [fetchPosts])

  useEffect(() => {
    api('/forum/rooms').then(data => setRooms(data.rooms)).catch(() => {})
  }, [])

  const refreshRooms = () => api('/forum/rooms').then(data => setRooms(data.rooms)).catch(() => {})

  const applyPost = updated => setPosts(list => list.map(post => post.id === updated.id ? updated : post))

  const react = async (post, type) => {
    try {
      const data = await api(`/forum/posts/${post.id}/react`, { method: 'POST', body: JSON.stringify({ type }) })
      applyPost(data.post)
    } catch (err) { setNotice(err.message) }
  }

  const report = async post => {
    try {
      const data = await api(`/forum/posts/${post.id}/report`, { method: 'POST' })
      setNotice(data.alreadyReported ? 'You have already reported this post.' : 'Thank you — a moderator will take a look.')
      if (data.reports >= 5) setPosts(list => list.filter(item => item.id !== post.id))
    } catch (err) { setNotice(err.message) }
  }

  const removePost = async post => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    try {
      await api(`/forum/posts/${post.id}`, { method: 'DELETE' })
      setPosts(list => list.filter(item => item.id !== post.id))
      setTotal(value => Math.max(0, value - 1))
      setNotice('Your post was deleted.')
      refreshRooms()
    } catch (err) { setNotice(err.message) }
  }

  const loadMore = async () => {
    setLoadingMore(true)
    try { await fetchPosts(posts.length) } catch (err) { setNotice(err.message) } finally { setLoadingMore(false) }
  }

  const submitPost = async payload => {
    const data = await api('/forum/posts', { method: 'POST', body: JSON.stringify(payload) })
    setComposerOpen(false)
    if (data.safety?.hidden) {
      setNotice(data.safety.message)
    } else {
      setNotice('Your post is live. Thank you for sharing.')
      fetchPosts(0).catch(() => {})
      refreshRooms()
    }
  }

  const submitEdit = async (post, payload) => {
    const data = await api(`/forum/posts/${post.id}`, { method: 'PUT', body: JSON.stringify(payload) })
    applyPost(data.post)
    setEditing(null)
    setNotice('Post updated.')
  }

  return (
    <div className="page forum-page">
      <div className="page-head">
        <div>
          <span className="kicker">COMMUNITY ROOMS</span>
          <h1>You're not alone here</h1>
          <p>Share as your alias. Be kind, keep names private, and lean on each other gently.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setComposerOpen(true)}><Plus size={16} /> Start a discussion</button>
      </div>

      {notice && <div className="toast-inline" onClick={() => setNotice('')}>{notice}</div>}

      <div className="forum-layout">
        <aside className="forum-rooms">
          <button className={`room-item ${roomId === '' ? 'room-active' : ''}`} onClick={() => setRoomId('')}>
            <span className="room-icon"><Leaf size={15} /></span><span className="room-copy"><b>All rooms</b><small>Every conversation</small></span>
          </button>
          {rooms.map(room => (
            <button key={room.id} className={`room-item ${roomId === room.id ? 'room-active' : ''}`} onClick={() => setRoomId(room.id)}>
              <span className="room-icon"><MessageCircle size={14} /></span>
              <span className="room-copy"><b>{room.name}</b><small>{room.postCount} posts</small></span>
            </button>
          ))}
        </aside>

        <section className="forum-feed">
          <div className="forum-toolbar">
            <label className="search-field">
              <Search size={16} />
              <input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') setSearch(query) }} placeholder="Search discussions…" aria-label="Search discussions" />
            </label>
            <select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort posts">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="popular">Most supported</option>
            </select>
          </div>

          {error && <ErrorBanner message={error} onRetry={() => fetchPosts(0)} />}

          {loading ? <div className="panel"><Skeleton rows={4} /></div>
            : posts.length === 0 ? (
              <EmptyState icon={Users} title="No discussions here yet" action={<button className="btn btn-soft" onClick={() => setComposerOpen(true)}>Start the first one</button>}>
                Your words might be exactly what someone else needs to read.
              </EmptyState>
            ) : (
              <>
                {posts.map(post => (
                  <article className="post-card" key={post.id}>
                    <header className="post-head">
                      <span className="post-avatar">{post.authorAlias.slice(0, 1)}</span>
                      <div className="post-meta">
                        <b>{post.authorAlias}</b>
                        <small>{post.room} · {formatRelative(post.createdAt)}{post.updatedAt !== post.createdAt ? ' · edited' : ''}</small>
                      </div>
                      <div className="post-controls">
                        {post.mine && <button className="icon-button" onClick={() => setEditing(post)} aria-label="Edit post"><Pencil size={15} /></button>}
                        {post.mine && <button className="icon-button" onClick={() => removePost(post)} aria-label="Delete post"><Trash2 size={15} /></button>}
                        {!post.mine && <button className="icon-button" onClick={() => report(post)} aria-label="Report post"><Flag size={15} /></button>}
                      </div>
                    </header>
                    {post.title && <h3 className="post-title">{post.title}</h3>}
                    <p className="post-body">{post.body}</p>
                    <footer className="post-foot">
                      <div className="reaction-row">
                        {REACTIONS.map(({ type, label, icon: Icon }) => (
                          <button key={type} className={`reaction ${post.reacted.includes(type) ? 'reaction-on' : ''}`} onClick={() => react(post, type)}>
                            <Icon size={14} /> {post.reactions[type]} <span>{label}</span>
                          </button>
                        ))}
                      </div>
                      <button className="comment-link" onClick={() => setDetailId(post.id)}>
                        <MessageCircle size={15} /> {post.commentCount} {post.commentCount === 1 ? 'reply' : 'replies'}
                      </button>
                    </footer>
                  </article>
                ))}
                {hasMore && (
                  <div className="load-more">
                    <button className="btn btn-soft" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : `Load more (${total - posts.length} left)`}</button>
                  </div>
                )}
              </>
            )}
        </section>
      </div>

      {composerOpen && <Composer rooms={rooms} onClose={() => setComposerOpen(false)} onSubmit={submitPost} />}
      {editing && <Composer rooms={rooms} post={editing} onClose={() => setEditing(null)} onSubmit={payload => submitEdit(editing, payload)} />}
      {detailId && <PostDetail postId={detailId} onClose={() => { setDetailId(null); fetchPosts(0).catch(() => {}) }} />}
    </div>
  )
}

function Composer({ rooms, post, onClose, onSubmit }) {
  const [title, setTitle] = useState(post?.title || '')
  const [roomId, setRoomId] = useState(post?.roomId || rooms[0]?.id || 'general')
  const [body, setBody] = useState(post?.body || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async event => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onSubmit({ ...(title.trim() ? { title: title.trim() } : {}), roomId, body: body.trim() })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal kicker={post ? 'EDIT POST' : 'NEW DISCUSSION'} title={post ? 'Update your words' : 'Share with the community'} onClose={onClose} wide
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Sharing…' : post ? 'Save changes' : 'Post to community'}</button>
      </>}>
      <form className="composer" onSubmit={submit}>
        <ErrorBanner message={error} />
        <label className="field"><span>Room</span>
          <select value={roomId} onChange={event => setRoomId(event.target.value)}>
            {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Title <em>(optional)</em></span><input value={title} onChange={event => setTitle(event.target.value)} maxLength={120} placeholder="A short, gentle headline" /></label>
        <label className="field"><span>Your message</span><textarea value={body} onChange={event => setBody(event.target.value)} rows={5} maxLength={2000} required placeholder="You can be as brief or as open as you like…" /></label>
        <p className="verify-note">Please avoid real names or contact details. Crisis content is handled privately with care and won't be posted publicly.</p>
      </form>
    </Modal>
  )
}

function PostDetail({ postId, onClose }) {
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState('')

  const load = useCallback(async () => {
    const data = await api(`/forum/posts/${postId}`)
    setPost(data.post)
    setComments(data.comments)
  }, [postId])

  useEffect(() => {
    setLoading(true)
    load().catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [load])

  const addComment = async event => {
    event.preventDefault()
    if (!commentText.trim()) return
    try {
      const data = await api(`/forum/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ body: commentText.trim() }) })
      setComments(list => [...list, data.comment])
      setCommentText('')
    } catch (err) { setError(err.message) }
  }

  const addReply = async commentId => {
    if (!replyText.trim()) return
    try {
      const data = await api(`/forum/comments/${commentId}/replies`, { method: 'POST', body: JSON.stringify({ body: replyText.trim() }) })
      setComments(list => list.map(comment => comment.id === commentId ? { ...comment, replies: [...comment.replies, data.reply] } : comment))
      setReplyText('')
      setReplyTo(null)
    } catch (err) { setError(err.message) }
  }

  const deleteComment = async comment => {
    try {
      await api(`/forum/comments/${comment.id}`, { method: 'DELETE' })
      setComments(list => list.filter(item => item.id !== comment.id))
    } catch (err) { setError(err.message) }
  }

  const deleteReply = async (commentId, replyId) => {
    try {
      await api(`/forum/replies/${replyId}`, { method: 'DELETE' })
      setComments(list => list.map(comment => comment.id === commentId ? { ...comment, replies: comment.replies.filter(reply => reply.id !== replyId) } : comment))
    } catch (err) { setError(err.message) }
  }

  return (
    <Modal kicker={post?.room?.toUpperCase()} title={post?.title || 'Discussion'} onClose={onClose} wide
      footer={<button className="btn btn-primary" onClick={onClose}>Close</button>}>
      {loading ? <Skeleton rows={4} /> : error ? <ErrorBanner message={error} onRetry={load} /> : (
        <div className="post-detail">
          <div className="detail-post">
            <header className="post-head">
              <span className="post-avatar">{post.authorAlias.slice(0, 1)}</span>
              <div className="post-meta"><b>{post.authorAlias}</b><small>{formatRelative(post.createdAt)}</small></div>
            </header>
            <p className="post-body">{post.body}</p>
            <div className="reaction-row">
              {REACTIONS.map(({ type, label, icon: Icon }) => (
                <span key={type} className={`reaction static ${post.reacted.includes(type) ? 'reaction-on' : ''}`}><Icon size={14} /> {post.reactions[type]} <span>{label}</span></span>
              ))}
            </div>
          </div>

          <h3 className="detail-comments-title">{comments.length} {comments.length === 1 ? 'reply' : 'replies'}</h3>

          {comments.map(comment => (
            <div className="comment" key={comment.id}>
              <header className="post-head small">
                <span className="post-avatar">{comment.authorAlias.slice(0, 1)}</span>
                <div className="post-meta"><b>{comment.authorAlias}</b><small>{formatRelative(comment.createdAt)}</small></div>
                {comment.mine && <button className="icon-button" onClick={() => deleteComment(comment)} aria-label="Delete comment"><Trash2 size={14} /></button>}
              </header>
              <p>{comment.body}</p>
              <div className="comment-actions">
                <button className="link-more" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>Reply</button>
              </div>
              {comment.replies.map(reply => (
                <div className="reply" key={reply.id}>
                  <header className="post-head small">
                    <span className="post-avatar">{reply.authorAlias.slice(0, 1)}</span>
                    <div className="post-meta"><b>{reply.authorAlias}</b><small>{formatRelative(reply.createdAt)}</small></div>
                    {reply.mine && <button className="icon-button" onClick={() => deleteReply(comment.id, reply.id)} aria-label="Delete reply"><Trash2 size={13} /></button>}
                  </header>
                  <p>{reply.body}</p>
                </div>
              ))}
              {replyTo === comment.id && (
                <div className="reply-form">
                  <input value={replyText} onChange={event => setReplyText(event.target.value)} placeholder="Write a kind reply…" maxLength={1000}
                    onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addReply(comment.id) } }} />
                  <button className="btn btn-primary btn-sm" onClick={() => addReply(comment.id)}><Send size={14} /></button>
                </div>
              )}
            </div>
          ))}

          <form className="comment-form" onSubmit={addComment}>
            <input value={commentText} onChange={event => setCommentText(event.target.value)} placeholder="Add a supportive reply…" maxLength={1000} aria-label="Add a comment" />
            <button className="btn btn-primary" disabled={!commentText.trim()}><Send size={15} /> Reply</button>
          </form>
        </div>
      )}
    </Modal>
  )
}
