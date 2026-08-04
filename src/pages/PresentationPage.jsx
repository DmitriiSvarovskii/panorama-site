import { useCallback, useEffect, useRef, useState } from 'react'

import './PresentationPage.css'
const SLIDES_VERSION = '20260613'

const slides = Array.from({ length: 44 }, (_, index) => {

    return `/slides-webp/slide-${index + 1}.webp?v=${SLIDES_VERSION}`

})

const slideLoadCache = new Map()

const normalizeSlideIndex = (index) => (index + slides.length) % slides.length

const preloadSlide = (src) => {

    if (typeof window === 'undefined') {

        return Promise.resolve()

    }

    const cachedSlide = slideLoadCache.get(src)

    if (cachedSlide) {

        return cachedSlide

    }

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

            resolve(src)

        }

        img.onerror = () => {

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

        preloadSlide(slides[targetSlide])
            .then(() => {

                if (navigationRequestRef.current === requestId) {

                    setCurrentSlide(targetSlide)
                    setPendingSlide(null)

                }

            })
            .catch(() => {

                if (navigationRequestRef.current === requestId) {

                    setCurrentSlide(targetSlide)
                    setPendingSlide(null)

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
        </main>
    )
}

export default PresentationPage
