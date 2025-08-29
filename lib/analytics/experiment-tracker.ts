/**
 * Cardinal Experiment Tracking & Analytics System
 * Tracks input method effectiveness, user behavior, and conversion metrics
 */

export interface ExperimentEvent {
  id: string
  timestamp: Date
  sessionId: string
  userId?: string | undefined
  eventType:
    | 'method_selected'
    | 'method_started'
    | 'method_abandoned'
    | 'method_completed'
    | 'requirements_generated'
    | 'error_occurred'
  inputMethod:
    | 'constrained-form'
    | 'open-text'
    | 'guided-prompts'
    | 'conversational'
  metadata: Record<string, any>
}

export interface InputMethodMetrics {
  methodType:
    | 'constrained-form'
    | 'open-text'
    | 'guided-prompts'
    | 'conversational'
  startTime: number
  completionTime?: number
  stepCount: number
  revisionsCount: number
  userAgent: string
  completionRate?: number
  errorRate?: number
  averageCompletionTime?: number
}

export interface ExperimentSession {
  sessionId: string
  userId?: string | undefined
  startTime: Date
  endTime?: Date | undefined
  inputMethodsAttempted: string[]
  finalMethodUsed?: string | undefined
  completed: boolean
  requirements?: any
  totalDuration?: number | undefined
  deviceInfo: {
    userAgent: string
    screenWidth: number
    screenHeight: number
    isMobile: boolean
  }
}

export interface ExperimentAnalytics {
  totalSessions: number
  completedSessions: number
  conversionRate: number
  methodPopularity: Record<string, number>
  methodCompletionRates: Record<string, number>
  methodAverageCompletionTime: Record<string, number>
  methodErrorRates: Record<string, number>
  abandonmentPoints: Record<string, number>
  userSegments: Record<string, any>
}

// In-memory storage for development (would use database in production)
class ExperimentStorage {
  private events: ExperimentEvent[] = []
  private sessions: Map<string, ExperimentSession> = new Map()
  private metrics: Map<string, InputMethodMetrics> = new Map()

  addEvent(event: ExperimentEvent): void {
    this.events.push(event)

    // Update session data
    const session = this.sessions.get(event.sessionId)
    if (session) {
      if (event.eventType === 'method_selected') {
        if (!session.inputMethodsAttempted.includes(event.inputMethod)) {
          session.inputMethodsAttempted.push(event.inputMethod)
        }
      } else if (event.eventType === 'method_completed') {
        session.finalMethodUsed = event.inputMethod
        session.completed = true
        session.endTime = event.timestamp
        session.totalDuration =
          session.endTime.getTime() - session.startTime.getTime()
        session.requirements = event.metadata.requirements
      }

      this.sessions.set(event.sessionId, session)
    }
  }

  addMetrics(sessionId: string, metrics: InputMethodMetrics): void {
    this.metrics.set(sessionId, metrics)
  }

  getEvents(filter?: Partial<ExperimentEvent>): ExperimentEvent[] {
    if (!filter) {
      return [...this.events]
    }

    return this.events.filter(event => {
      return Object.entries(filter).every(
        ([key, value]) => event[key as keyof ExperimentEvent] === value
      )
    })
  }

  getSessions(): ExperimentSession[] {
    return Array.from(this.sessions.values())
  }

  getMetrics(): InputMethodMetrics[] {
    return Array.from(this.metrics.values())
  }

  getSession(sessionId: string): ExperimentSession | undefined {
    return this.sessions.get(sessionId)
  }

  createSession(sessionId: string, userId?: string): ExperimentSession {
    const session: ExperimentSession = {
      sessionId,
      userId: userId || undefined,
      startTime: new Date(),
      inputMethodsAttempted: [],
      completed: false,
      deviceInfo: {
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
        screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
        isMobile:
          typeof window !== 'undefined' ? window.innerWidth < 768 : false,
      },
    }

    this.sessions.set(sessionId, session)
    return session
  }

  clear(): void {
    this.events = []
    this.sessions.clear()
    this.metrics.clear()
  }
}

// Global experiment tracker
class ExperimentTracker {
  private storage = new ExperimentStorage()
  private currentSessionId: string | null = null
  private userId: string | undefined = undefined

  // Initialize tracking for a new session
  initializeSession(userId?: string): string {
    this.currentSessionId = this.generateSessionId()
    this.userId = userId

    const session = this.storage.createSession(
      this.currentSessionId,
      this.userId
    )

    // Track session initialization
    this.trackEvent('method_selected', 'constrained-form', {
      isInitialization: true,
      deviceInfo: session.deviceInfo,
    })

    return this.currentSessionId
  }

  // Track an experiment event
  trackEvent(
    eventType: ExperimentEvent['eventType'],
    inputMethod: ExperimentEvent['inputMethod'],
    metadata: Record<string, any> = {}
  ): void {
    if (!this.currentSessionId) {
      this.initializeSession()
    }

    const event: ExperimentEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      sessionId: this.currentSessionId!,
      userId: this.userId,
      eventType,
      inputMethod,
      metadata,
    }

    this.storage.addEvent(event)

    // Send to analytics endpoint if configured
    this.sendToAnalytics(event).catch(error => {
      console.warn('Failed to send analytics event:', error)
    })
  }

  // Track input method metrics
  trackInputMethodMetrics(metrics: InputMethodMetrics): void {
    if (!this.currentSessionId) {
      return
    }

    this.storage.addMetrics(this.currentSessionId, metrics)

    // Also track as completion event
    this.trackEvent('method_completed', metrics.methodType, {
      metrics,
      completionTime: metrics.completionTime,
      stepCount: metrics.stepCount,
      revisionsCount: metrics.revisionsCount,
    })
  }

  // Track method selection
  trackMethodSelection(methodType: ExperimentEvent['inputMethod']): void {
    this.trackEvent('method_selected', methodType, {
      timestamp: Date.now(),
    })
  }

  // Track method start
  trackMethodStart(
    methodType: ExperimentEvent['inputMethod'],
    metadata: Record<string, any> = {}
  ): void {
    this.trackEvent('method_started', methodType, {
      ...metadata,
      startTime: Date.now(),
    })
  }

  // Track method abandonment
  trackMethodAbandonment(
    methodType: ExperimentEvent['inputMethod'],
    abandonmentPoint: string
  ): void {
    this.trackEvent('method_abandoned', methodType, {
      abandonmentPoint,
      timestamp: Date.now(),
    })
  }

  // Track successful completion
  trackMethodCompletion(
    methodType: ExperimentEvent['inputMethod'],
    requirements: any,
    metrics: InputMethodMetrics
  ): void {
    this.trackEvent('method_completed', methodType, {
      requirements,
      metrics,
      completionTime: Date.now(),
    })

    this.trackInputMethodMetrics(metrics)
  }

  // Track errors
  trackError(
    methodType: ExperimentEvent['inputMethod'],
    error: string,
    metadata: Record<string, any> = {}
  ): void {
    this.trackEvent('error_occurred', methodType, {
      error,
      ...metadata,
      timestamp: Date.now(),
    })
  }

  // Get current session analytics
  getCurrentSessionAnalytics(): ExperimentSession | null {
    if (!this.currentSessionId) {
      return null
    }
    return this.storage.getSession(this.currentSessionId) || null
  }

  // Generate comprehensive analytics
  generateAnalytics(): ExperimentAnalytics {
    const sessions = this.storage.getSessions()
    const events = this.storage.getEvents()
    const metrics = this.storage.getMetrics()

    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.completed).length
    const conversionRate =
      totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

    // Method popularity (how often each method is attempted)
    const methodPopularity: Record<string, number> = {}
    sessions.forEach(session => {
      session.inputMethodsAttempted.forEach(method => {
        methodPopularity[method] = (methodPopularity[method] || 0) + 1
      })
    })

    // Method completion rates
    const methodCompletionRates: Record<string, number> = {}
    const methodAttempts: Record<string, number> = {}
    const methodCompletions: Record<string, number> = {}

    sessions.forEach(session => {
      session.inputMethodsAttempted.forEach(method => {
        methodAttempts[method] = (methodAttempts[method] || 0) + 1
      })

      if (session.finalMethodUsed && session.completed) {
        methodCompletions[session.finalMethodUsed] =
          (methodCompletions[session.finalMethodUsed] || 0) + 1
      }
    })

    Object.keys(methodAttempts).forEach(method => {
      const attempts = methodAttempts[method] || 0
      const completions = methodCompletions[method] || 0
      methodCompletionRates[method] =
        attempts > 0 ? (completions / attempts) * 100 : 0
    })

    // Average completion times
    const methodAverageCompletionTime: Record<string, number> = {}
    const methodTimes: Record<string, number[]> = {}

    metrics.forEach(metric => {
      if (metric.completionTime) {
        if (!methodTimes[metric.methodType]) {
          methodTimes[metric.methodType] = []
        }
        methodTimes[metric.methodType]?.push(
          metric.completionTime - metric.startTime
        )
      }
    })

    Object.keys(methodTimes).forEach(method => {
      const times = methodTimes[method]
      if (times && times.length > 0) {
        methodAverageCompletionTime[method] =
          times.reduce((sum, time) => sum + time, 0) / times.length
      }
    })

    // Error rates
    const methodErrorRates: Record<string, number> = {}
    const errorEvents = events.filter(e => e.eventType === 'error_occurred')
    const methodErrorCounts: Record<string, number> = {}

    errorEvents.forEach(event => {
      methodErrorCounts[event.inputMethod] =
        (methodErrorCounts[event.inputMethod] || 0) + 1
    })

    Object.keys(methodAttempts).forEach(method => {
      const errors = methodErrorCounts[method] || 0
      const attempts = methodAttempts[method] || 0
      methodErrorRates[method] = attempts > 0 ? (errors / attempts) * 100 : 0
    })

    // Abandonment points
    const abandonmentPoints: Record<string, number> = {}
    events
      .filter(e => e.eventType === 'method_abandoned')
      .forEach(event => {
        const point = event.metadata.abandonmentPoint || 'unknown'
        abandonmentPoints[point] = (abandonmentPoints[point] || 0) + 1
      })

    // User segments (basic)
    const userSegments = {
      mobile: sessions.filter(s => s.deviceInfo.isMobile).length,
      desktop: sessions.filter(s => !s.deviceInfo.isMobile).length,
      authenticated: sessions.filter(s => s.userId).length,
      anonymous: sessions.filter(s => !s.userId).length,
    }

    return {
      totalSessions,
      completedSessions,
      conversionRate,
      methodPopularity,
      methodCompletionRates,
      methodAverageCompletionTime,
      methodErrorRates,
      abandonmentPoints,
      userSegments,
    }
  }

  // Export data for analysis
  exportData() {
    return {
      events: this.storage.getEvents(),
      sessions: this.storage.getSessions(),
      metrics: this.storage.getMetrics(),
      analytics: this.generateAnalytics(),
    }
  }

  // Clear all data (for testing)
  clearData(): void {
    this.storage.clear()
    this.currentSessionId = null
    this.userId = undefined
  }

  // Private helper methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async sendToAnalytics(event: ExperimentEvent): Promise<void> {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event)
    }

    // Send to analytics endpoint
    try {
      await fetch('/netlify/functions/analytics-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
    } catch (error) {
      console.warn('Analytics endpoint failed:', error)
    }
  }
}

// Global instance
export const experimentTracker = new ExperimentTracker()

// React hook for using experiment tracking
export function useExperimentTracking() {
  const initializeSession = (userId?: string) => {
    return experimentTracker.initializeSession(userId)
  }

  const trackMethodSelection = (method: ExperimentEvent['inputMethod']) => {
    experimentTracker.trackMethodSelection(method)
  }

  const trackMethodStart = (
    method: ExperimentEvent['inputMethod'],
    metadata?: Record<string, any>
  ) => {
    experimentTracker.trackMethodStart(method, metadata)
  }

  const trackMethodCompletion = (
    method: ExperimentEvent['inputMethod'],
    requirements: any,
    metrics: InputMethodMetrics
  ) => {
    experimentTracker.trackMethodCompletion(method, requirements, metrics)
  }

  const trackMethodAbandonment = (
    method: ExperimentEvent['inputMethod'],
    point: string
  ) => {
    experimentTracker.trackMethodAbandonment(method, point)
  }

  const trackError = (
    method: ExperimentEvent['inputMethod'],
    error: string,
    metadata?: Record<string, any>
  ) => {
    experimentTracker.trackError(method, error, metadata)
  }

  const getAnalytics = () => {
    return experimentTracker.generateAnalytics()
  }

  const getCurrentSession = () => {
    return experimentTracker.getCurrentSessionAnalytics()
  }

  const exportData = () => {
    return experimentTracker.exportData()
  }

  return {
    initializeSession,
    trackMethodSelection,
    trackMethodStart,
    trackMethodCompletion,
    trackMethodAbandonment,
    trackError,
    getAnalytics,
    getCurrentSession,
    exportData,
  }
}
