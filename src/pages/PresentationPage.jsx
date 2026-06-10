import { useEffect, useState } from 'react'
import saveButton from '../assets/save-button.png'

import './PresentationPage.css'

const slides = Array.from({ length: 42 }, (_, index) => {
    return `/slides-webp/slide-${index + 1}.webp`
})

function PresentationPage() {

    const [currentSlide, setCurrentSlide] = useState(0)

    const nextSlide = () => {

        setCurrentSlide((prev) => (prev + 1) % slides.length)

    }

    const prevSlide = () => {

        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

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
                <div className="slideBox">
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

                <button className="saveButton">
                    <img src={saveButton} alt="Скачать" />
                </button>
            </section>
        </main>
    )
}

export default PresentationPage