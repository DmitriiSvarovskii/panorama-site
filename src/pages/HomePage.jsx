import { Link } from 'react-router-dom'

import '../App.css'

import logoBlock from '../assets/logoblock.png'
import elementOne from '../assets/element-1.png'
import titleBlock from '../assets/title.png'
import buttonCase from '../assets/button-case.png'
import tgMail from '../assets/tg-mail.png'

function HomePage() {
    return (
        <main className="page">
            <section className="hero">
                <img className="decor" src={elementOne} alt="" />

                <div className="left">
                    <img className="title" src={titleBlock} alt="Креативное агентство спецпроектов" />

                    <Link to="/presentation" className="caseButton">
                        <img src={buttonCase} alt="Смотреть презентацию" />
                    </Link>
                </div>

                <img className="logoBlock" src={logoBlock} alt="Panorama" />

                <div className="contacts">
                    <img className="contactIcons" src={tgMail} alt="На связи" />
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