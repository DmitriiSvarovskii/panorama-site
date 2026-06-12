import { Link } from 'react-router-dom'

import '../App.css'

import panoramaLogo from '../assets/panorama-logo.svg'
import tgIcon from '../assets/tg.svg'
import mailIcon from '../assets/mail.svg'

function HomePage() {
    return (
        <main className="page">
            <section className="hero">


                <div className="left">
                    <div className="title">
                        <h1
                            className="heroTitle"
                            aria-label="Креативное агентство спецпроектов"
                        >
                            <span className="titleDesktop">
                                Креативное агентство<br />
                                спецпроектов<span className="heroEmoji" aria-hidden="true">✌🏻</span>
                            </span>

                            <span className="titleMobile" aria-hidden="true">
                                Креативное<br />
                                агентство<span className="heroEmoji">✌🏻</span><br />
                                спецпроектов
                            </span>
                        </h1>

                        <p
                            className="heroSubtitle"
                            aria-label="придумываем производим запускаем"
                        >
                            <span className="subtitleDesktop">
                                придумываем | производим | запускаем
                            </span>

                            <span className="subtitleMobile" aria-hidden="true">
                                придумываем |<br />
                                производим | запускаем
                            </span>
                        </p>
                    </div>

                    <Link to="/presentation" className="caseButton">
                        смотреть кейсы
                    </Link>
                </div>

                <div className="logoBlock" role="img" aria-label="Panorama">
                    <span className="logoEllipse" aria-hidden="true" />
                    <img className="logoText" src={panoramaLogo} alt="" />
                </div>

                <div className="contacts">
                    <a
                        href="https://t.me/marriapanova"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img className="contactIcon" src={tgIcon} alt="Telegram" />
                    </a>

                    <a href="mailto:info@panorama360.ru">
                        <img className="contactIcon" src={mailIcon} alt="Email" />
                    </a>

                    <span className="contactsText">
                        на связи
                    </span>
                </div>

                <p className="legal">
                    Общество с ограниченной ответственностью «ПАНОРАМА» Юридический адрес:
                    117420, г. Москва, ул. Намёткина, д. 14, к. 1
                </p>
            </section>
        </main>
    )
}

export default HomePage
