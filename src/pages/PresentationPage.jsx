import { useCallback, useEffect, useRef, useState } from 'react'

import './PresentationPage.css'
const SLIDES_VERSION = '20260615'

const slides = Array.from({ length: 44 }, (_, index) => {

    return `/slides-webp/slide-${index + 1}.webp?v=${SLIDES_VERSION}`

})

const DIAGNOSTIC_STORAGE_KEY = 'panoramaPresentationDiagnostics'
const DIAGNOSTIC_SESSION_KEY = 'panoramaPresentationSession'
const DIAGNOSTIC_RETENTION_MS = 2 * 60 * 60 * 1000
const DIAGNOSTIC_MAX_EVENTS = 240
const SLOW_SLIDE_LOAD_MS = 3000
const slideLoadCache = new Map()

const normalizeSlideIndex = (index) => (index + slides.length) % slides.length

const getSlideNumberFromSrc = (src) => {

    const match = src.match(/slide-(\d+)\.webp/)

    return match ? Number(match[1]) : null

}

const getDiagnosticSession = () => {

    if (typeof window === 'undefined') {

        return 'server'

    }

    try {

        const existingSession = window.sessionStorage.getItem(DIAGNOSTIC_SESSION_KEY)

        if (existingSession) {

            return existingSession

        }

        const nextSession = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

        window.sessionStorage.setItem(DIAGNOSTIC_SESSION_KEY, nextSession)

        return nextSession

    } catch {

        return 'unavailable'

    }

}

const getConnectionInfo = () => {

    if (typeof navigator === 'undefined') {

        return {}

    }

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

    if (!connection) {

        return {}

    }

    return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
    }

}

const readDiagnosticEvents = () => {

    if (typeof window === 'undefined') {

        return []

    }

    try {

        const events = JSON.parse(window.localStorage.getItem(DIAGNOSTIC_STORAGE_KEY) || '[]')
        const cutoff = Date.now() - DIAGNOSTIC_RETENTION_MS

        return events
            .filter((event) => Date.parse(event.time) >= cutoff)
            .slice(-DIAGNOSTIC_MAX_EVENTS)

    } catch {

        return []

    }

}

const getDebugMode = () => {

    if (typeof window === 'undefined') {

        return false

    }

    return new URLSearchParams(window.location.search).get('debug') === '1'

}

const sendDiagnosticBeacon = (entry) => {

    if (typeof window === 'undefined') {

        return

    }

    const params = new URLSearchParams()

    Object.entries(entry).forEach(([key, value]) => {

        if (value !== undefined && value !== null && value !== '') {

            params.set(key, String(value))

        }

    })

    window.fetch(`/client-log?${params.toString()}`, {
        cache: 'no-store',
        keepalive: true,
    }).catch(() => undefined)

}

const logPresentationEvent = (event, details = {}, options = {}) => {

    if (typeof window === 'undefined') {

        return

    }

    const entry = {
        time: new Date().toISOString(),
        event,
        session: getDiagnosticSession(),
        version: SLIDES_VERSION,
        online: navigator.onLine,
        path: window.location.pathname,
        ...getConnectionInfo(),
        ...details,
    }

    try {

        const events = [...readDiagnosticEvents(), entry].slice(-DIAGNOSTIC_MAX_EVENTS)

        window.localStorage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(events))
        window.dispatchEvent(new CustomEvent('presentationDiagnostic', { detail: entry }))

    } catch {

        // Diagnostics should never break the presentation.

    }

    if (options.sendToServer) {

        sendDiagnosticBeacon(entry)

    }

}

const preloadSlide = (src) => {

    if (typeof window === 'undefined') {

        return Promise.resolve()

    }

    const cachedSlide = slideLoadCache.get(src)

    if (cachedSlide) {

        return cachedSlide

    }

    const slideNumber = getSlideNumberFromSrc(src)
    const startTime = window.performance?.now?.() ?? Date.now()
    const slowLoadTimer = window.setTimeout(() => {

        logPresentationEvent('slide_load_slow', {
            slide: slideNumber,
            duration: Math.round((window.performance?.now?.() ?? Date.now()) - startTime),
            src,
        }, { sendToServer: true })

    }, SLOW_SLIDE_LOAD_MS)

    logPresentationEvent('slide_load_start', {
        slide: slideNumber,
        src,
    })

    const slidePromise = new Promise((resolve, reject) => {

        const img = new Image()

        img.onload = async () => {

            try {

                if (img.decode) {

                    await img.decode()

                }

            } catch {

                // The image is already loaded; decoding can still fail in older browsers.

            }

            window.clearTimeout(slowLoadTimer)

            logPresentationEvent('slide_load_success', {
                slide: slideNumber,
                duration: Math.round((window.performance?.now?.() ?? Date.now()) - startTime),
                src,
            })

            resolve(src)

        }

        img.onerror = () => {

            window.clearTimeout(slowLoadTimer)

            logPresentationEvent('slide_load_error', {
                slide: slideNumber,
                duration: Math.round((window.performance?.now?.() ?? Date.now()) - startTime),
                src,
            }, { sendToServer: true })

            reject(new Error(`Не удалось загрузить ${src}`))

        }

        img.src = src

    }).catch((error) => {

        slideLoadCache.delete(src)

        throw error

    })

    slideLoadCache.set(src, slidePromise)

    return slidePromise

}

const preloadIndexes = (indexes) => {

    indexes.forEach((index) => {

        preloadSlide(slides[normalizeSlideIndex(index)]).catch(() => undefined)

    })

}

function PresentationPage() {

    const [currentSlide, setCurrentSlide] = useState(0)
    const [pendingSlide, setPendingSlide] = useState(null)
    const [touchStart, setTouchStart] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isDebugMode] = useState(getDebugMode)
    const [diagnosticEvents, setDiagnosticEvents] = useState(readDiagnosticEvents)
    const navigationRequestRef = useRef(0)

    const goToSlide = useCallback((index) => {

        const targetSlide = normalizeSlideIndex(index)
        const requestId = navigationRequestRef.current + 1

        navigationRequestRef.current = requestId

        if (targetSlide === currentSlide) {

            setPendingSlide(null)

            return

        }

        setPendingSlide(targetSlide)

        logPresentationEvent('slide_navigation', {
            fromSlide: currentSlide + 1,
            toSlide: targetSlide + 1,
        })

        preloadSlide(slides[targetSlide])
            .then(() => {

                if (navigationRequestRef.current === requestId) {

                    setCurrentSlide(targetSlide)
                    setPendingSlide(null)

                    logPresentationEvent('slide_displayed', {
                        slide: targetSlide + 1,
                    })

                }

            })
            .catch(() => {

                if (navigationRequestRef.current === requestId) {

                    setCurrentSlide(targetSlide)
                    setPendingSlide(null)

                    logPresentationEvent('slide_display_after_error', {
                        slide: targetSlide + 1,
                    }, { sendToServer: true })

                }

            })

    }, [currentSlide])

    const nextSlide = useCallback(() => {

        goToSlide((pendingSlide ?? currentSlide) + 1)

    }, [currentSlide, goToSlide, pendingSlide])

    const prevSlide = useCallback(() => {

        goToSlide((pendingSlide ?? currentSlide) - 1)

    }, [currentSlide, goToSlide, pendingSlide])

    const openFullscreen = () => {
        setIsFullscreen(true)
    }

    const closeFullscreen = () => {
        setIsFullscreen(false)
    }

    const copyDiagnosticEvents = () => {

        navigator.clipboard?.writeText(JSON.stringify(readDiagnosticEvents(), null, 2))
            .catch(() => undefined)

    }

    const handleTouchStart = (event) => {

        setTouchStart(event.changedTouches[0].screenX)

    }

    const handleTouchEnd = (event) => {

        const touchEnd = event.changedTouches[0].screenX

        const distance = touchStart - touchEnd

        if (distance > 50) {

            nextSlide()

        }

        if (distance < -50) {

            prevSlide()

        }

    }

    useEffect(() => {

        logPresentationEvent('presentation_open', {
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            debug: isDebugMode,
        }, { sendToServer: true })

        const updateDiagnostics = () => {

            setDiagnosticEvents(readDiagnosticEvents())

        }

        const handleOnline = () => {

            logPresentationEvent('browser_online', {}, { sendToServer: true })

        }

        const handleOffline = () => {

            logPresentationEvent('browser_offline', {}, { sendToServer: true })

        }

        if (isDebugMode) {

            window.addEventListener('presentationDiagnostic', updateDiagnostics)

        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {

            if (isDebugMode) {

                window.removeEventListener('presentationDiagnostic', updateDiagnostics)

            }

            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)

        }

    }, [isDebugMode])

    useEffect(() => {

        preloadIndexes([

            (currentSlide + 1) % slides.length,

            (currentSlide + 2) % slides.length,

            (currentSlide - 1 + slides.length) % slides.length,

            (currentSlide - 2 + slides.length) % slides.length,

        ])

    }, [currentSlide])

    useEffect(() => {

        let isCancelled = false
        let idleCallbackId = null
        let timeoutId = null

        const warmSlidesCache = async () => {

            const priorityIndexes = [0, 1, 2, slides.length - 1]

            preloadIndexes(priorityIndexes)

            for (let index = 0; index < slides.length; index += 1) {

                if (isCancelled) {

                    return

                }

                await preloadSlide(slides[index]).catch(() => undefined)

            }

        }

        if ('requestIdleCallback' in window) {

            idleCallbackId = window.requestIdleCallback(warmSlidesCache, { timeout: 2000 })

        } else {

            timeoutId = window.setTimeout(warmSlidesCache, 1000)

        }

        return () => {

            isCancelled = true

            if (idleCallbackId !== null) {

                window.cancelIdleCallback(idleCallbackId)

            }

            if (timeoutId !== null) {

                window.clearTimeout(timeoutId)

            }

        }

    }, [])

    useEffect(() => {

        const handleKeyDown = (event) => {

            if (event.key === 'ArrowRight') {

                nextSlide()

            }

            if (event.key === 'ArrowLeft') {

                prevSlide()

            }

        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {

            window.removeEventListener('keydown', handleKeyDown)

        }

    }, [nextSlide, prevSlide])
    return (
        <main className="presentationPage">
            <section className="presentationWrapper">
                <div
                    className="slideBox"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <button
                        className="fullscreenButton"
                        onClick={openFullscreen}
                    >
                        ⛶
                    </button>

                    <button className="arrow arrowLeft" onClick={prevSlide}>
                        ‹
                    </button>

                    <img
                        className="slideImage"
                        src={slides[currentSlide]}
                        alt={`Слайд ${currentSlide + 1}`}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                    />

                    {pendingSlide !== null && (
                        <div className="slideLoading" role="status" aria-live="polite">
                            <span className="slideLoaderIcon" aria-hidden="true" />
                            <span className="visuallyHidden">Загрузка слайда</span>
                        </div>
                    )}

                    <button className="arrow arrowRight" onClick={nextSlide}>
                        ›
                    </button>

                    <div className="slideCounter">
                        {currentSlide + 1} / {slides.length}
                    </div>
                </div>

                <a
                    className="saveButton"
                    href="/files/presentation.pdf"
                    download
                >
                    Скачать
                </a>
            </section>
            {isFullscreen && (
                <div
                    className="fullscreenOverlay"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <button className="closeFullscreenButton" onClick={closeFullscreen}>
                        ×
                    </button>

                    <button className="arrow arrowLeft" onClick={prevSlide}>
                        ‹
                    </button>

                    <img
                        className="fullscreenSlideImage"
                        src={slides[currentSlide]}
                        alt={`Слайд ${currentSlide + 1}`}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                    />

                    {pendingSlide !== null && (
                        <div className="slideLoading fullscreenLoading" role="status" aria-live="polite">
                            <span className="slideLoaderIcon" aria-hidden="true" />
                            <span className="visuallyHidden">Загрузка слайда</span>
                        </div>
                    )}

                    <button className="arrow arrowRight" onClick={nextSlide}>
                        ›
                    </button>

                    <div className="slideCounter fullscreenCounter">
                        {currentSlide + 1} / {slides.length}
                    </div>
                </div>
            )}

            {isDebugMode && (
                <aside className="diagnosticPanel">
                    <div className="diagnosticHeader">
                        <span>Диагностика</span>
                        <button type="button" onClick={copyDiagnosticEvents}>
                            Скопировать
                        </button>
                    </div>
                    <pre>
                        {diagnosticEvents.slice(-24).map((event) => (
                            `${event.time} ${event.event} slide=${event.slide ?? event.toSlide ?? ''} duration=${event.duration ?? ''} online=${event.online}\n`
                        ))}
                    </pre>
                </aside>
            )}
        </main>
    )
}

export default PresentationPage
