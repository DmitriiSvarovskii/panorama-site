import { useEffect, useState } from 'react'
import saveButton from '../assets/save-button.png'

import './PresentationPage.css'

const slides = Array.from({ length: 42 }, (_, index) => {
    return `/slides-webp/slide-${index + 1}.webp`
})

function PresentationPage() {

    const [currentSlide, setCurrentSlide] = useState(0)
    const [touchStart, setTouchStart] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const nextSlide = () => {

        setCurrentSlide((prev) => (prev + 1) % slides.length)

    }

    const prevSlide = () => {

        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

    }
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

        const preloadIndexes = [

            (currentSlide + 1) % slides.length,

            (currentSlide + 2) % slides.length,

            (currentSlide - 1 + slides.length) % slides.length,

            (currentSlide - 2 + slides.length) % slides.length,

        ]

        preloadIndexes.forEach(index => {

            const img = new Image()

            img.src = slides[index]

        })

    }, [currentSlide])

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

    }, [])
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
                    />

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
                    <img src={saveButton} alt="Скачать" />
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
                    />

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