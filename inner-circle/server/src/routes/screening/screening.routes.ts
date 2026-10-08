import { Request, Response, NextFunction } from 'express'
import User from '../models/User'
import { inferRisk, demoCase } from '../ai/fuzzy/engine'

// GET /api/screening/history - Get user's screening history
export const getScreeningHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // In a full implementation, would fetch from DB
    // For now, return mock data
    res.json({ screenings: [] })
  } catch (error: any) {
    next(error)
  }
}

// POST /api/screening/phq9 - Submit PHQ-9 scoring
export const submitPhq9 = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const userId = (req as any).user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const {
      item1, item2, item3, item4, item5, item6, item7, item8, item9,
      functionalDifficulty
    } = req.body

    // Calculate total score (0-27)
    const answers = [item1, item2, item3, item4, item5, item6, item7, item8, item9].map(
      (i: number) => i
    )
    const total = answers.reduce((sum: number, val: number) => sum + val, 0)

    // Determine severity
    let severity = 'Minimal'
    if (total >= 20) severity = 'Severe'
    else if (total >= 15) severity = 'Moderately severe'
    else if (total >= 10) severity = 'Moderate'
    else if (total >= 5) severity = 'Mild'

    // Fuzzy risk inference
    const riskResult = inferRisk({
      phq9: total,
      gad7: 0, // Will be updated when GAD-7 is submitted
      sentiment: 0,
      stress: 5, // Default, will be updated
      functional: functionalDifficulty || 5,
    })

    // Update or create user's latest assessment
    const user = await User.findById(userId)
    if (user) {
      user.consent.research = true // Mark as consented for research during onboarding
      await user.save()
    }

    res.json({
      success: true,
      phq9: {
        total,
        severity,
        item9Flag: item9 > 0,
      },
      risk: riskResult,
    })
  } catch (error: any) {
    next(error)
  }
}

// POST /api/screening/gad7 - Submit GAD-7 scoring
export const submitGad7 = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const userId = (req as any).user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const {
      item1, item2, item3, item4, item5, item6, item7,
    } = req.body

    // Calculate total score (0-21)
    const answers = [item1, item2, item3, item4, item5, item6, item7].map(
      (i: number) => i
    )
    const total = answers.reduce((sum: number, val: number) => sum + val, 0)

    // Determine severity
    let severity = 'Minimal'
    if (total >= 15) severity = 'Severe'
    else if (total >= 10) severity = 'Moderate'
    else if (total >= 5) severity = 'Mild'

    // Fuzzy risk inference with GAD-7
    const riskResult = inferRisk({
      phq9: 0, // Will be updated when PHQ-9 is submitted
      gad7: total,
      sentiment: 0,
      stress: 5,
      functional: 5,
    })

    res.json({
      success: true,
      gad7: {
        total,
        severity,
      },
      risk: riskResult,
    })
  } catch (error: any) {
    next(error)
  }
}

// GET /api/screening/history - Get screening history
export const getScreeningHistoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ screenings: [] })
  } catch (error: any) {
    next(error)
  }
}

// Demo case endpoint
export const getDemoCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = demoCase()
    res.json({
      success: true,
      demoCase: {
        riskScore: result.riskScore,
        tier: result.tier,
        level: result.level,
        memberships: result.memberships,
        firedRules: result.firedRules,
        contributors: result.contributors,
        narrative: result.narrative,
      },
    })
  } catch (error: any) {
    next(error)
  }
}

// Rule sanity check endpoint
export const checkRuleSanity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phq9, gad7 } = req.query
    const result = inferRisk({
      phq9: Number(phq9) || 0,
      gad7: Number(gad7) || 0,
      sentiment: -0.4,
      stress: 7,
      functional: 5,
    })
    res.json({
      success: true,
      phq9: Number(phq9),
      gad7: Number(gad7),
      riskScore: result.riskScore,
      tier: result.tier,
      level: result.level,
    })
  } catch (error: any) {
    next(error)
  }
}

export default {
  getScreeningHistory,
  submitPhq9,
  submitGad7,
  getScreeningHistory: getScreeningHistoryHandler,
  getDemoCase,
  checkRuleSanity,
}