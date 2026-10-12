import request from 'supertest'
import app from '../app'

describe('Inner Circle API end-to-end', () => {
  const email = `student_${Date.now()}@test.local`
  let token = ''

  it('registers a new student and returns an anonymous alias', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ firstName: 'Test', lastName: 'Student', email, password: 'TestPass123' })
    expect(res.status).toBe(201)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.user.alias).toBeTruthy()
    expect(res.body.user.role).toBe('student')
    token = res.body.accessToken
  })

  it('rejects logins with the wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' })
    expect(res.status).toBe(401)
  })

  it('signs the student back in', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'TestPass123' })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    token = res.body.accessToken
  })

  it('blocks unauthenticated risk inference', async () => {
    const res = await request(app)
      .post('/api/risk/infer')
      .send({ phq9: 10, gad7: 8, sentiment: -0.3, stress: 6, functional: 5 })
    expect(res.status).toBe(401)
  })

  it('runs an authenticated inference', async () => {
    const res = await request(app)
      .post('/api/risk/infer')
      .set('Authorization', `Bearer ${token}`)
      .send({ phq9: 14, gad7: 12, sentiment: -0.4, stress: 7, functional: 6 })
    expect(res.status).toBe(200)
    expect(typeof res.body.riskScore).toBe('number')
    expect(res.body.tier).toBeGreaterThanOrEqual(1)
    expect(res.body.narrative.length).toBeGreaterThan(0)
  })

  it('forces tier 3 on a safety-flagged inference', async () => {
    const res = await request(app)
      .post('/api/risk/infer')
      .set('Authorization', `Bearer ${token}`)
      .send({ phq9: 22, gad7: 16, sentiment: -0.9, stress: 9, functional: 8, item9Flag: true })
    expect(res.status).toBe(200)
    expect(res.body.tier).toBe(3)
    expect(res.body.level).toBe('High')
  })

  it('detects crisis language in chat', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'I want to end my life' })
    expect(res.status).toBe(200)
    expect(res.body.crisis.isCrisis).toBe(true)
    expect(res.body.reply).toBeTruthy()
  })

  it('returns crisis resources from the safety pathway', async () => {
    const res = await request(app)
      .post('/api/safety/help-now')
      .set('Authorization', `Bearer ${token}`)
      .send({ trigger: 'help-now-button' })
    expect(res.status).toBe(200)
    expect(res.body.safetyOverride).toBe(true)
    expect(res.body.resources.length).toBeGreaterThan(0)
  })

  it('serves seeded forum posts', async () => {
    const res = await request(app).get('/api/forum/posts').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.posts)).toBe(true)
    expect(res.body.posts.length).toBeGreaterThan(0)
  })

  it('restricts analytics to admins and serves it to an admin', async () => {
    const denied = await request(app).get('/api/admin/analytics').set('Authorization', `Bearer ${token}`)
    expect(denied.status).toBe(403)

    const admin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@demo.innercircle.test', password: 'DemoPass123' })
    expect(admin.status).toBe(200)

    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${admin.body.accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body.totals.registeredStudents).toBeGreaterThan(0)
    expect(res.body.minCellSize).toBe(5)
  })

  it('keeps chat context across messages in the same session', async () => {
    const session = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(session.status).toBe(201)
    const sessionId = session.body.session.id

    const first = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'I am really stressed about my exams', sessionId })
    expect(first.status).toBe(200)
    expect(first.body.sessionId).toBe(sessionId)
    expect(first.body.message.role).toBe('assistant')
    expect(Array.isArray(first.body.suggestions)).toBe(true)

    const second = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Talking about it helps a little', sessionId })
    expect(second.status).toBe(200)
    expect(second.body.sessionId).toBe(sessionId)

    const conversation = await request(app)
      .get(`/api/chat/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(conversation.status).toBe(200)
    expect(conversation.body.messages.length).toBe(4)
    expect(conversation.body.messages[0].role).toBe('user')
    expect(conversation.body.messages[3].role).toBe('assistant')
  })

  it('supports the full anonymous community flow', async () => {
    const created = await request(app)
      .post('/api/forum/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: 'wins-gratitude', body: 'Small win today: I studied for two focused hours and took a walk.' })
    expect(created.status).toBe(201)
    const postId = created.body.post.id
    expect(created.body.post.mine).toBe(true)
    expect(created.body.post.authorId).toBeUndefined()

    const reacted = await request(app)
      .post(`/api/forum/posts/${postId}/react`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'support' })
    expect(reacted.status).toBe(200)
    expect(reacted.body.post.reactions.support).toBe(1)
    expect(reacted.body.post.reacted).toContain('support')

    const comment = await request(app)
      .post(`/api/forum/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Proud of you, this is real progress.' })
    expect(comment.status).toBe(201)

    const reply = await request(app)
      .post(`/api/forum/comments/${comment.body.comment.id}/replies`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Thank you, that means a lot.' })
    expect(reply.status).toBe(201)

    const detail = await request(app)
      .get(`/api/forum/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(detail.status).toBe(200)
    expect(detail.body.comments.length).toBe(1)
    expect(detail.body.comments[0].replies.length).toBe(1)
    expect(detail.body.post.commentCount).toBe(2)
  })

  it('hides crisis language in community posts behind a safety message', async () => {
    const res = await request(app)
      .post('/api/forum/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: 'general', body: 'I want to end my life tonight.' })
    expect(res.status).toBe(201)
    expect(res.body.safety.hidden).toBe(true)
    expect(typeof res.body.safety.message).toBe('string')
  })

  it('saves and lists bookmarked resources for the signed-in student', async () => {
    const key = 'Anxiety Toolkit::Box breathing exercise'
    const saved = await request(app)
      .post('/api/resources/saved')
      .set('Authorization', `Bearer ${token}`)
      .send({ resourceKey: key })
    expect(saved.status).toBe(201)
    expect(saved.body.saved).toContain(key)

    const list = await request(app)
      .get('/api/resources/saved')
      .set('Authorization', `Bearer ${token}`)
    expect(list.status).toBe(200)
    expect(list.body.saved).toContain(key)
  })
})
