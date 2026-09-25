
        const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyU-ANmzwMksQMGumLOy814KFm1BRD5pjtbpHvQ2Z-uMAxS_1aMO1yr7LJKV2mLgA6n/exec";
        const PROMO_WEEKS = [44, 45, 46, 47, 48];
        const PROMO_YEAR = 2026;

        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied'
        });

        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-EFSD1E0WZP');

        CookieConsent.run({
            guiOptions: { consentModal: { layout: 'box', position: 'bottom right', equalWeightButtons: true } },
            categories: { necessary: { readOnly: true, enabled: true }, analytics: { enabled: false } },
            language: {
                default: 'fi',
                translations: {
                    fi: {
                        consentModal: {
                            title: 'Käytämme evästeitä',
                            description: 'Käytämme evästeitä parantaaksemme sivuston käyttökokemusta ja analysoidaksemme liikennettä.',
                            acceptAllBtn: 'Hyväksy kaikki',
                            acceptNecessaryBtn: 'Vain välttämättömät',
                            showPreferencesBtn: 'Asetukset'
                        },
                        preferencesModal: {
                            title: 'Evästeasetukset',
                            acceptAllBtn: 'Hyväksy kaikki',
                            acceptNecessaryBtn: 'Vain välttämättömät',
                            savePreferencesBtn: 'Tallenna valinnat',
                            sections: [
                                { title: 'Välttämättömät evästeet', description: 'Nämä evästeet ovat välttämättömiä sivuston toiminnan kannalta.', linkedCategory: 'necessary' },
                                { title: 'Analyysievästeet', description: 'Näiden evästeiden avulla ymmärrämme kävijäliikennettä.', linkedCategory: 'analytics' }
                            ]
                        }
                    }
                }
            },
            onConsent: ({cookie}) => { if (CookieConsent.acceptedCategory('analytics')) gtag('consent', 'update', {'analytics_storage': 'granted'}); },
            onChange: ({cookie, changedCategories}) => { if (changedCategories.includes('analytics')) gtag('consent', 'update', {'analytics_storage': CookieConsent.acceptedCategory('analytics') ? 'granted' : 'denied'}); }
        });   

        function onBookingSubmit(token) {
            const form = document.getElementById("booking-form");
            if (form.checkValidity()) {
                form.submit();
            } else {
                form.reportValidity();
            }
        }

    let allWeeksData = [];
    let aleDebounceTimer = null;
    let currentSelectedViikkoText = "";
    let originalSelectedPrice = 0;
    let currentDiscountPercent = 0;

    function parseDate(dateString) {
        if (!dateString) return null;
        if (typeof dateString === 'string') {
            const cleanStr = dateString.trim();
            if (cleanStr.includes('T')) {
                const d = new Date(cleanStr);
                if (!isNaN(d.getTime())) {
                    const localDate = new Date(d.getTime() + (3 * 60 * 60 * 1000));
                    return new Date(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate(), 0, 0, 0, 0);
                }
            }
            if (cleanStr.includes('.')) {
                const parts = cleanStr.split('.');
                if (parts.length === 3) {
                    return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 0, 0, 0, 0);
                }
            } else if (cleanStr.includes('-')) {
                const parts = cleanStr.split('-');
                if (parts.length === 3) {
                    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
                }
            }
        }
        const d = new Date(dateString);
        return !isNaN(d.getTime()) ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0) : null;
    }

    function formatDate(dateString) {
        const d = parseDate(dateString);
        if (!d) return dateString;
        return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
    }

    document.addEventListener("DOMContentLoaded", function () {
        fetch(GOOGLE_SHEET_API_URL)
            .then(response => response.json())
            .then(data => {
                allWeeksData = data;
                renderoiKampanjaviikot();
            })
            .catch(error => {
                console.error("Virhe haettaessa tietoja taulukosta:", error);
                const container = document.getElementById("promo-grid-container");
                if (container) {
                    container.innerHTML = "<p style='color:red; grid-column: 1/-1; text-align: center;'>Varaustietojen lataaminen epäonnistui.</p>";
                }
            });
    });

    function renderoiKampanjaviikot() {
        const container = document.getElementById("promo-grid-container");
        if (!container) return;

        container.innerHTML = "";

        // Suodatetaan vain halutut vuodelle 2026 määritellyt kampanjaviikot
        const promoData = allWeeksData.filter(item => {
            if (!item.viikko) return false;
            
            const vkoNum = parseInt(item.viikko.toString().replace(/\D/g, ''), 10);
            const isCorrectWeek = PROMO_WEEKS.includes(vkoNum);

            const startDate = parseDate(item.alkupvm);
            const isCorrectYear = startDate ? startDate.getFullYear() === PROMO_YEAR : true;

            return isCorrectWeek && isCorrectYear;
        });

        if (promoData.length === 0) {
            container.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #94a3b8;'>Ei saatavilla olevia kampanjaviikkoja.</p>";
            return;
        }

        promoData.forEach(item => {
            const isAvailable = item.tila && item.tila.toString().trim().toLowerCase() === "vapaa";
            const startFormatted = formatDate(item.alkupvm);
            const endFormatted = formatDate(item.loppupvm);
            const dateText = (startFormatted && endFormatted) ? `${startFormatted} – ${endFormatted}` : "";
            
            const vkoNum = parseInt(item.viikko.toString().replace(/\D/g, ''), 10);
            const viikkoNimi = `Viikko ${vkoNum}`;

            const card = document.createElement("div");

            if (isAvailable) {
                // Käytetään oikeaa CSS-luokkaa 'week-card-btn'
                card.className = "week-card-btn";
                card.onclick = () => selectWeek(`${viikkoNimi} (${dateText})`, item.hinta);
                
                card.innerHTML = `
                    <div>
                        <span class="wk-title">${viikkoNimi}</span>
                        ${dateText ? `<span class="wk-dates">${dateText}</span>` : ''}
                    </div>
                    <div>
                        <span class="wk-price">${item.hinta}</span>
                        <div class="action-tag">Valitse viikko →</div>
                    </div>
                `;
            } else {
                // Varattu kortti: säädetään läpinäkyvyyttä ja estetää klikkaus
                card.className = "week-card-btn";
                card.style.opacity = "0.4";
                card.style.cursor = "not-allowed";
                card.style.animation = "none";
                
                card.innerHTML = `
                    <div>
                        <span class="wk-title">${viikkoNimi}</span>
                        ${dateText ? `<span class="wk-dates">${dateText}</span>` : ''}
                    </div>
                    <div>
                        <span class="wk-price">${item.hinta}</span>
                        <div class="action-tag" style="background:#64748b; animation:none;">VARATTU</div>
                    </div>
                `;
            }

            container.appendChild(card);
        });
    }

    function selectWeek(viikko, hinta) {
        currentSelectedViikkoText = viikko;
        const cleanPriceStr = (hinta || "").toString().replace(/[^\d]/g, '');
        const rawPrice = parseInt(cleanPriceStr, 10);
        originalSelectedPrice = !isNaN(rawPrice) ? rawPrice : 0;

        const koodiInput = document.getElementById('alekoodi');
        if (!koodiInput || koodiInput.value.trim() === '') {
            currentDiscountPercent = 0;
        }

        paivitaValittuViikkoTeksti();

        // Avataan varauslomake
        const modal = document.getElementById('bookingModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Estetään taustan skrollaus
        }

        if (koodiInput && koodiInput.value.trim() !== '') {
            laskeAlehinta();
        }
    }

    function closeBookingModal() {
        const modal = document.getElementById('bookingModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto'; // Palautetaan skrollaus
        }
    }

    // 3. MODALIN SULKEMINEN KLIKKAAMALLA TAUSTAA
    function closeModalOnBg(event) {
        // Suljetaan vain jos klikataan tummaa taustaa, ei itse korttia
        if (event.target.id === 'bookingModal') {
            closeBookingModal();
        }
    }

    function paivitaValittuViikkoTeksti() {
        const viikkoInput = document.getElementById('valittu_viikko');
        if (!viikkoInput || !currentSelectedViikkoText) return;

        if (originalSelectedPrice > 0) {
            if (currentDiscountPercent > 0) {
                const rawDiscounted = originalSelectedPrice * (1 - currentDiscountPercent / 100);
                const alennettuHinta = Math.floor(rawDiscounted / 10) * 10;
                
                viikkoInput.value = `${currentSelectedViikkoText} (Hinta: ${alennettuHinta} €, alennuskoodi hyödynnetty / norm. ${originalSelectedPrice} €)`;
            } else {
                viikkoInput.value = `${currentSelectedViikkoText} (Hinta: ${originalSelectedPrice} €)`;
            }
        } else {
            viikkoInput.value = currentSelectedViikkoText;
        }
    }

    function laskeAlehinta() {
        const koodiInput = document.getElementById('alekoodi');
        const viestiEl = document.getElementById('ale_viesti');
        
        if (!koodiInput || !viestiEl) return;

        const koodi = koodiInput.value.trim().toUpperCase();
        clearTimeout(aleDebounceTimer);

        if (!koodi) {
            currentDiscountPercent = 0;
            viestiEl.textContent = '';
            paivitaValittuViikkoTeksti();
            return;
        }

        viestiEl.style.color = '#94a3b8';
        viestiEl.textContent = 'Tarkistetaan koodia...';

        aleDebounceTimer = setTimeout(() => {
            tarkistaKoodiBackendista(koodi);
        }, 600);
    }

    async function tarkistaKoodiBackendista(koodi) {
        const koodiInput = document.getElementById('alekoodi'); // <- MÄÄRITELMÄ LISÄTTY TÄHÄN
        const viestiEl = document.getElementById('ale_viesti');

        if (!viestiEl) return;

        // 1. Tarkistus ennen verkkopyyntöä
        if (koodiInput && koodiInput.value.trim().toUpperCase() !== koodi) {
            return; 
        }

        try {
            const response = await fetch(`${GOOGLE_SHEET_API_URL}?action=checkPromo&code=${encodeURIComponent(koodi)}`);
            const data = await response.json();

            // 2. Tarkistus vastauksen tultua (estää vanhan tuloksen näyttämisen jos koodia on jatkettu)
            if (koodiInput && koodiInput.value.trim().toUpperCase() !== koodi) {
                return;
            }

            if (data.valid) {
                viestiEl.style.color = '#4ade80';

                const rawDiscount = data.Ale_prosentti ?? data.ale_prosentti ?? data.discountPercent ?? data.discount ?? data.alennus;
                const discountPercent = parseFloat(rawDiscount);

                if (!isNaN(discountPercent) && discountPercent > 0) {
                    currentDiscountPercent = discountPercent;
                    let alennusTeksti = `✓ Koodi aktiivinen! Alennus: ${discountPercent}%`;
                    
                    if (originalSelectedPrice > 0) {
                        const rawDiscountedPrice = originalSelectedPrice * (1 - discountPercent / 100);
                        const alennettuHinta = Math.floor(rawDiscountedPrice / 10) * 10;
                        alennusTeksti += ` (Uusi hinta: ${alennettuHinta} €)`;
                    }

                    viestiEl.textContent = alennusTeksti;
                } else {
                    currentDiscountPercent = 0;
                    viestiEl.textContent = `✓ Koodi aktiivinen!`;
                }
            } else {
                currentDiscountPercent = 0;
                viestiEl.style.color = '#f87171';
                viestiEl.textContent = '✕ Virheellinen tai vanhentunut koodi.';
            }
        } catch (err) {
            if (koodiInput && koodiInput.value.trim().toUpperCase() !== koodi) return;

            currentDiscountPercent = 0;
            viestiEl.style.color = '#f87171';
            viestiEl.textContent = 'Koodin tarkistus epäonnistui.';
        }

        paivitaValittuViikkoTeksti();
    }

    function closeModal() {
        const modal = document.getElementById('bookingModal') || document.querySelector('.modal-overlay');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto'; // Palautetaan taustan skrollaus
        }
    }

    const reviews = [
        {
        stars: "★★★★★",
        quote: "”Täydellinen tukikohta ensilumille. Hiihtämään pääsee ihan mökin vierestä.”",
        author: "— Matti K."
        },
        {
        stars: "★★★★",  
        quote: "”Erittäin siisti ja hyvin varusteltu mökki. Iso plussa hyvästä keittiön varustelusta.”",
        author: "— Janne S."
        },
        {
        stars: "★★★★★",
        quote: "”Keskeinen sijainti. Tämä oli toinen kerta ja toivottavasti pääsemme uudestaan!”",
        author: "— Suvi & Mikko"
        }
    ];

    let currentReviewIndex = 0;
    const starsEl = document.getElementById('rating-stars');
    const quoteEl = document.getElementById('review-quote');
    const authorEl = document.getElementById('review-author');
    const contentEl = document.getElementById('review-content');

    setInterval(() => {
        contentEl.classList.add('fade-out');

        setTimeout(() => {
        currentReviewIndex = (currentReviewIndex + 1) % reviews.length;
        starsEl.textContent = reviews[currentReviewIndex].stars;
        quoteEl.textContent = reviews[currentReviewIndex].quote;
        authorEl.textContent = reviews[currentReviewIndex].author;

        contentEl.classList.remove('fade-out');
        }, 500); // 500ms vive vastaa CSS transition -aikaa
    }, 4000); // 4000ms = 4 sekuntia

    const galleryImages = [
        { src: "/images/ulko_ensi.jpg", caption: "Aito kelomökki Äkäslompolossa" },
        { src: "/images/makuuhuone.jpg", caption: "Viihtyisä makuuhuone" },
        { src: "/images/olohuone.jpg", caption: "Tunnelmallinen olohuone ja takka" },
        { src: "/images/keittio.jpg", caption: "Täysin varusteltu keittiö" },
        { src: "/images/sauna.jpg", caption: "Oma sauna ulkoilupäivän jälkeen" },
        { src: "/images/ylakuva.jpg", caption: "Parvitilat ja lisävuoteet" },
        { src: "/images/kota_ulko.jpg", caption: "Grillikota vapaasti käytettävissä" },
        { src: "/images/suksihuolto.jpg", caption: "Lämmin suksienhuoltotila" }
    ];
    let currentLightboxIndex = 0;

    function scrollGallery(amount) {
        const container = document.getElementById('galleryContainer');
        if (container) container.scrollBy({ left: amount, behavior: 'smooth' });
    }

    function openLightbox(index) {
        if (index < 0 || index >= galleryImages.length) return;
        currentLightboxIndex = index;
        const modal = document.getElementById('lightbox');
        const img = document.getElementById('lightbox-img');
        const caption = document.getElementById('lightbox-caption');
        
        if (modal && img) {
            img.src = galleryImages[currentLightboxIndex].src;
            if (caption) caption.textContent = galleryImages[currentLightboxIndex].caption;
            modal.classList.add('active');
        }
    }

    function closeLightbox() {
        const modal = document.getElementById('lightbox');
        if (modal) modal.classList.remove('active');
    }

    function closeLightboxOnBg(event) {
        if (event.target.id === 'lightbox') closeLightbox();
    }

    function prevImage(event) {
        if (event) event.stopPropagation();
        currentLightboxIndex = (currentLightboxIndex - 1 + galleryImages.length) % galleryImages.length;
        openLightbox(currentLightboxIndex);
    }

    function nextImage(event) {
        if (event) event.stopPropagation();
        currentLightboxIndex = (currentLightboxIndex + 1) % galleryImages.length;
        openLightbox(currentLightboxIndex);
    }

    async function haeYllasSaa() {
        // Äkäslompolo, Ylläs koordinaatit
        const lat = 67.6042;
        const lon = 24.1571;
        
        // Luotettavampi osoite nykyiselle säällä ja lumipeitteelle
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,snow_depth&timezone=Europe%2FHelsinki`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Sään haku epäonnistui, status: ${response.status}`);
            }
            
            const data = await response.json();
            const current = data.current;

            // Tarkistetaan että saatiin validia dataa
            if (!current) return;

            // Muutetaan sääkoodi selkeäksi ikoniksi
            const icon = haeSaaIkoni(current.weather_code);
            
            // Pyöristetään lämpötila
            const temp = Math.round(current.temperature_2m);
            const tempText = temp > 0 ? `+${temp}°C` : `${temp}°C`;
            
            // API antaa lumisyvyyden metreinä -> muutetaan senttimetreiksi
            const snowMetres = current.snow_depth !== undefined && current.snow_depth !== null ? current.snow_depth : 0;
            const snowCm = Math.round(snowMetres * 100);

            // Päivitetään DOM-elementit
            const iconElem = document.querySelector(".yllas-weather-strip .weather-icon");
            const tempElem = document.querySelector(".yllas-weather-strip .temp-display");
            const snowElem = document.querySelector(".yllas-weather-strip .snow-display");

            if (iconElem) iconElem.textContent = icon;
            if (tempElem) tempElem.textContent = tempText;
            if (snowElem) {
                // Jos lunta on 0 cm (esim. kesällä), voidaan näyttää pelkkä lämpötila tai piilottaa osio
                snowElem.textContent = `${snowCm} cm lunta`;
            }

        } catch (error) {
            console.error("Virhe sään haussa:", error);
        }
    }

    // Apufunktio sääikoneille
    function haeSaaIkoni(code) {
        if (code === 0) return "☀️";
        if (code >= 1 && code <= 3) return "🌤️";
        if (code >= 45 && code <= 48) return "🌫️";
        if (code >= 51 && code <= 67) return "🌧️";
        if (code >= 71 && code <= 77) return "❄️";
        if (code >= 80 && code <= 82) return "🌦️";
        if (code >= 85 && code <= 86) return "🌨️";
        if (code >= 95) return "🌩️";
        return "🌡️";
    }

    // Kutsutaan funktiota
    document.addEventListener("DOMContentLoaded", haeYllasSaa);
