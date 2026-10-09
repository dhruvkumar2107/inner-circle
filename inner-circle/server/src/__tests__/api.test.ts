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
})
