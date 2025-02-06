const tuval = document.getElementById('oyunAlani');
const cizimAlani = tuval.getContext('2d');

const OYUN = {
    ALAN: {
        GENISLIK: 3000,
        YUKSEKLIK: 3000
    },
    DUSMAN: {
        SAYI: 10,
        HIZ: 2.5,
        ATES_SURESI: 1500,
        GORUS_MESAFESI: 9999
    },
    SILAH: {
        MAKS_SAYI: 15,
        YENI_OLUSTURMA_SURESI: 3000
    },
    MOBIL: {
        JOYSTICK: {
            YARICAP: 60,
            HASSASIYET: 1.2,
            KONUM: {
                X: 100,
                Y: null
            },
            SABIT_KONUM: true
        },
        ATES: {
            YARICAP: 50,
            KONUM: {
                X: null,
                Y: null
            }
        },
        JOYSTICK_BOYUT: 150,
        ATES_BUTON_BOYUT: 150,
        MINI_HARITA_BOYUT: 200,
        YAKINLIK: 0.45,
        ARAYUZ_OLCEK: 2.0,
        HASSASIYET: 0.8,
        KAMERA_HIZ: 0.1
    }
};

const kamera = {
    x: 0,
    y: 0,
    yakinlik: 1,
    takipHizi: 0.1
};

const oyuncu = {
    x: OYUN.ALAN.GENISLIK / 2,
    y: OYUN.ALAN.YUKSEKLIK / 2,
    genislik: 20,
    yukseklik: 80,
    hiz: 5,
    can: 100,
    silahVar: false,
    mermiSayisi: 0,
    yon: 1,
    renk: '#ffffff',
    aci: 0,
    silahTip: null,
    sonAtesZamani: 0
};

let dusmanlar = [];
let mermiler = [];
let silahlar = [];
let parcaciklar = [];
let oyunDevamEdiyor = false;
let oyuncuAdi = '';
let mobilOtomatikAtesInterval = null;
let mobilOtomatikAtes = false;

const mobilKontroller = {
    joystick: {
        aktif: false,
        merkez: { x: 0, y: 0 },
        konum: { x: 0, y: 0 },
        delta: { x: 0, y: 0 },
        yaricap: 50,
        maksUzaklik: 40
    },
    atesButonu: {
        x: 0,
        y: 0,
        yaricap: 40,
        aktif: false
    },
    atesZamanlayici: null,
    butonlar: {
        ates: {
            visible: false
        }
    }
};

const tuslar = {
    sol: false,
    sag: false,
    yukari: false,
    asagi: false
};

const SKOR = {
    suankiSkor: 0,
    enYuksekSkor: localStorage.getItem('enYuksekSkor') || 0,
    oldurulenDusman: 0,
    skorArttir(miktar) {
        this.suankiSkor += miktar;
        if (this.suankiSkor > this.enYuksekSkor) {
            this.enYuksekSkor = this.suankiSkor;
            localStorage.setItem('enYuksekSkor', this.enYuksekSkor);
        }
    }
};

const SES = {
    ates: new Audio('ses/ates.mp3'),
    olum: new Audio('ses/olum.mp3'),
    oynat(ses) {
        if (ses) {
            ses.currentTime = 0;
            ses.play().catch(err => {
                console.log('Ses çalma hatası:', err);
            });
        }
    }
};

let animasyonID = null;

const SILAH = {
    NORMAL: {
        ATES_HIZI: 250,
        HASAR: 25,
        MERMI_BOYUT: 5,
        MERMI_HIZ: 15,
        MERMI_RENK: '#ffffff',
        SILAH_RENK: '#666666'
    },
    MINIGUN: {
        ATES_HIZI: 50,
        HASAR: 15,
        MERMI_BOYUT: 3,
        MERMI_HIZ: 20,
        MERMI_RENK: '#ffffff',
        SILAH_RENK: '#ff3333'
    }
};

const DUSMAN = {
    NORMAL: {
        CAN: 100,
        HIZ: 2.5,
        BOYUT: { w: 20, h: 80 },
        HASAR: 5,
        RENK: '#ff3333',
        MERMI_BOYUT: 5,
        MERMI_RENK: '#ff0000'
    },
    BOSS: {
        CAN: 300,
        HIZ: 1.5,
        BOYUT: { w: 60, h: 240 },
        HASAR: 50,
        RENK: '#990000',
        MERMI_BOYUT: 15,
        MERMI_RENK: '#ff0000',
        ISIM: 'Safsata Canavarı'
    }
};

const MERMI = {
    OYUNCU: {
        NORMAL: {
            RENK: '#ffffff',
            TAKIP_GUCU: 0.15,
            MENZIL: 1200
        },
        MINIGUN: {
            RENK: '#ffffff',
            TAKIP_GUCU: 0.2,
            MENZIL: 1000
        }
    },
    DUSMAN: {
        NORMAL: {
            RENK: '#ff0000',
            TAKIP_GUCU: 0.1,
            MENZIL: 800
        },
        BOSS: {
            RENK: '#ff3333',
            TAKIP_GUCU: 0.15,
            MENZIL: 1000
        }
    }
};

const ANIMASYON = {
    YURUME_HIZI: 0.1,
    SALLANMA_MIKTARI: 5,
    KAFA_DONME: 0.05
};

let animasyonZamani = 0;
let kafaDonmeAcisi = 0;

let mouseBasili = false;
let sonAtesZamani = 0;

function checkOrientation() {
    if (window.mobileCheck()) {
        if (window.innerHeight < window.innerWidth) {
            document.documentElement.classList.add('landscape');
            document.documentElement.classList.remove('portrait');
        } else {
            document.documentElement.classList.add('portrait');
            document.documentElement.classList.remove('landscape');
        }
    }
}

window.addEventListener('load', checkOrientation);
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);

function silahKontrolEt() {
    if (!oyunDevamEdiyor) return;
    
    silahlar.forEach((silah, index) => {
        const ekranKonum = dunyaKonumundanEkranKonumuna(silah.x, silah.y);
        const oyuncuEkranKonum = dunyaKonumundanEkranKonumuna(oyuncu.x, oyuncu.y);
        const mesafe = Math.hypot(
            oyuncuEkranKonum.x - ekranKonum.x, 
            oyuncuEkranKonum.y - ekranKonum.y
        );
        
        if (mesafe < 60) {
            oyuncu.silahVar = true;
            oyuncu.silahTip = silah.tip;
            oyuncu.mermiSayisi = silah.mermiSayisi;
            silahlar.splice(index, 1);
            SES.oynat(SES.ates);
        }
    });
}

function canvasiBoyutlandir() {
    const isMobile = window.innerWidth <= 768;
    const width = isMobile ? window.innerWidth : 1200;
    const height = isMobile ? window.innerHeight : 600;

    tuval.width = width;
    tuval.height = height;
    tuval.style.width = `${width}px`;
    tuval.style.height = `${height}px`;

    if (isMobile) {
        kamera.yakinlik = OYUN.MOBIL.YAKINLIK;
        mobilKontrolleriGuncelle();
    } else {
        kamera.yakinlik = 1;
    }
}

function kamerayiGuncelle() {
    const isMobil = window.innerWidth <= 768;
    
    const hedefYakinlik = isMobil ? OYUN.MOBIL.YAKINLIK : 1;
    kamera.yakinlik += (hedefYakinlik - kamera.yakinlik) * OYUN.MOBIL.KAMERA_HIZ;
    
    const hedefX = oyuncu.x - (tuval.width / (2 * kamera.yakinlik));
    const hedefY = oyuncu.y - (tuval.height / (2 * kamera.yakinlik));
    
    kamera.x += (hedefX - kamera.x) * OYUN.MOBIL.KAMERA_HIZ;
    kamera.y += (hedefY - kamera.y) * OYUN.MOBIL.KAMERA_HIZ;
    
    kamera.x = Math.max(0, Math.min(kamera.x, OYUN.ALAN.GENISLIK - tuval.width / kamera.yakinlik));
    kamera.y = Math.max(0, Math.min(kamera.y, OYUN.ALAN.YUKSEKLIK - tuval.height / kamera.yakinlik));
}

function copAdamCiz(x, y, yukseklik, renk, yon, silahVar, isim = '', animasyon = null) {
    const genislik = yukseklik / 4;
    
    if (!animasyon) {
        animasyon = {
            bacakSallanma: 0,
            kolSallanma: 0,
            kafaDonme: 0
        };
    }
    
    cizimAlani.strokeStyle = renk;
    cizimAlani.lineWidth = 3;
    
    cizimAlani.beginPath();
    cizimAlani.moveTo(x, y);
    cizimAlani.lineTo(x - genislik + animasyon.bacakSallanma, y + yukseklik/2);
    cizimAlani.moveTo(x, y);
    cizimAlani.lineTo(x + genislik - animasyon.bacakSallanma, y + yukseklik/2);
    cizimAlani.stroke();
    
    cizimAlani.beginPath();
    cizimAlani.moveTo(x, y - yukseklik/4);
    cizimAlani.lineTo(x - genislik + animasyon.kolSallanma, y);
    cizimAlani.moveTo(x, y - yukseklik/4);
    cizimAlani.lineTo(x + genislik - animasyon.kolSallanma, y);
    cizimAlani.stroke();
    
    cizimAlani.beginPath();
    cizimAlani.moveTo(x, y - yukseklik/2);
    cizimAlani.lineTo(x, y);
    cizimAlani.stroke();
    
    cizimAlani.save();
    cizimAlani.translate(x, y - yukseklik/2);
    cizimAlani.rotate(animasyon.kafaDonme * 0.1);
    cizimAlani.beginPath();
    cizimAlani.arc(0, 0, genislik/2, 0, Math.PI * 2);
    cizimAlani.stroke();
    cizimAlani.restore();
    
    if (silahVar) {
        const silahUzunluk = genislik * 2;
        const silahY = y - yukseklik/4;
        
        cizimAlani.strokeStyle = '#666';
        cizimAlani.lineWidth = 4;
        cizimAlani.beginPath();
        cizimAlani.moveTo(x, silahY);
        cizimAlani.lineTo(x + (silahUzunluk * yon), silahY + animasyon.kolSallanma * 0.3);
        cizimAlani.stroke();
    }
    
    if (isim) {
        cizimAlani.fillStyle = '#fff';
        cizimAlani.font = '16px Arial';
        cizimAlani.textAlign = 'center';
        cizimAlani.fillText(isim, x, y - yukseklik - 10);
    }
}

function masaustuKontrolleriniEkle() {
    document.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                tuslar.yukari = true;
                break;
            case 's':
            case 'arrowdown':
                tuslar.asagi = true;
                break;
            case 'a':
            case 'arrowleft':
                tuslar.sol = true;
                oyuncu.yon = -1;
                break;
            case 'd':
            case 'arrowright':
                tuslar.sag = true;
                oyuncu.yon = 1;
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch(e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                tuslar.yukari = false;
                break;
            case 's':
            case 'arrowdown':
                tuslar.asagi = false;
                break;
            case 'a':
            case 'arrowleft':
                tuslar.sol = false;
                break;
            case 'd':
            case 'arrowright':
                tuslar.sag = false;
                break;
        }
    });

    tuval.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        silahAl();
    });

    tuval.addEventListener('mousemove', (e) => {
        const rect = tuval.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (tuval.width / rect.width);
        const y = (e.clientY - rect.top) * (tuval.height / rect.height);
        
        const dx = (x + kamera.x) - oyuncu.x;
        const dy = (y + kamera.y) - oyuncu.y;
        oyuncu.yon = dx > 0 ? 1 : -1;
        oyuncu.aci = Math.atan2(dy, dx);
    });

    tuval.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            mouseBasili = true;
            atesEt(e);
        }
    });

    tuval.addEventListener('mouseup', () => {
        mouseBasili = false;
    });

    tuval.addEventListener('mousemove', (e) => {
        if (mouseBasili && oyuncu.silahTip === 'MINIGUN') {
            atesEt(e);
        }
    });
}

function mobilKontrolleriniEkle() {
    const joystick = {
        aktif: false,
        merkez: { x: 0, y: 0 },
        konum: { x: 0, y: 0 },
        parmakID: null,
        sabitMerkez: { x: 0, y: 0 }
    };

    const atesButonu = {
        aktif: false,
        parmakID: null,
        x: 0,
        y: 0,
        yaricap: OYUN.MOBIL.ATES.YARICAP
    };

    function joystickKonumunuAyarla() {
        joystick.sabitMerkez.x = tuval.width * 0.15;
        joystick.sabitMerkez.y = tuval.height * 0.8;
        joystick.merkez = {...joystick.sabitMerkez};
        joystick.konum = {...joystick.sabitMerkez};

        atesButonu.x = tuval.width * 0.85;
        atesButonu.y = tuval.height * 0.8;
    }

    function joystickCiz() {
        cizimAlani.beginPath();
        cizimAlani.arc(joystick.sabitMerkez.x, joystick.sabitMerkez.y, OYUN.MOBIL.JOYSTICK.YARICAP, 0, Math.PI * 2);
        cizimAlani.fillStyle = 'rgba(255, 255, 255, 0.2)';
        cizimAlani.fill();

        if (joystick.aktif) {
            cizimAlani.beginPath();
            cizimAlani.arc(joystick.konum.x, joystick.konum.y, OYUN.MOBIL.JOYSTICK.YARICAP * 0.6, 0, Math.PI * 2);
            cizimAlani.fillStyle = 'rgba(255, 255, 255, 0.5)';
            cizimAlani.fill();
        } else {
            cizimAlani.beginPath();
            cizimAlani.arc(joystick.sabitMerkez.x, joystick.sabitMerkez.y, OYUN.MOBIL.JOYSTICK.YARICAP * 0.6, 0, Math.PI * 2);
            cizimAlani.fillStyle = 'rgba(255, 255, 255, 0.3)';
            cizimAlani.fill();
        }
    }

    function atesButonunuCiz() {
        if (!oyuncu.silahVar) return;

        cizimAlani.beginPath();
        cizimAlani.arc(atesButonu.x, atesButonu.y, atesButonu.yaricap, 0, Math.PI * 2);
        cizimAlani.fillStyle = atesButonu.aktif ? 'rgba(255, 50, 50, 0.8)' : 'rgba(255, 50, 50, 0.5)';
        cizimAlani.fill();

        cizimAlani.fillStyle = '#ffffff';
        cizimAlani.font = 'bold 20px Arial';
        cizimAlani.textAlign = 'center';
        cizimAlani.fillText('ATEŞ', atesButonu.x, atesButonu.y);
    }

    function silahKontrolEt() {
        silahlar.forEach((silah, index) => {
            const ekranKonum = dunyaKonumundanEkranKonumuna(silah.x, silah.y);
            const oyuncuEkranKonum = dunyaKonumundanEkranKonumuna(oyuncu.x, oyuncu.y);
            const mesafe = Math.hypot(
                oyuncuEkranKonum.x - ekranKonum.x, 
                oyuncuEkranKonum.y - ekranKonum.y
            );
            
            if (mesafe < 60) {
                oyuncu.silahVar = true;
                oyuncu.silahTip = silah.tip;
                oyuncu.mermiSayisi = silah.mermiSayisi;
                silahlar.splice(index, 1);
                SES.oynat(SES.ates);
            }
        });
    }

    tuval.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = tuval.getBoundingClientRect();
        
        Array.from(e.touches).forEach(touch => {
            const x = (touch.clientX - rect.left) * (tuval.width / rect.width);
            const y = (touch.clientY - rect.top) * (tuval.height / rect.height);
            
            const joystickMesafe = Math.hypot(x - joystick.sabitMerkez.x, y - joystick.sabitMerkez.y);
            if (joystickMesafe < OYUN.MOBIL.JOYSTICK.YARICAP * 2 && !joystick.aktif) {
                joystick.aktif = true;
                joystick.parmakID = touch.identifier;
                joystick.konum = {x, y};
            }
            
            if (oyuncu.silahVar && !atesButonu.aktif) {
                const atesMesafe = Math.hypot(x - atesButonu.x, y - atesButonu.y);
                if (atesMesafe < atesButonu.yaricap) {
                    atesButonu.aktif = true;
                    atesButonu.parmakID = touch.identifier;
                    mobilOtomatikAtes = true;
                    if (oyuncu.silahTip === 'MINIGUN' && !mobilOtomatikAtesInterval) {
                        mobilOtomatikAtesInterval = setInterval(mobilAkilliAtes, SILAH.MINIGUN.ATES_HIZI);
                    } else {
                        mobilAkilliAtes();
                    }
                }
            }
        });
    });

    tuval.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = tuval.getBoundingClientRect();
        
        Array.from(e.touches).forEach(touch => {
            if (touch.identifier === joystick.parmakID) {
                const x = (touch.clientX - rect.left) * (tuval.width / rect.width);
                const y = (touch.clientY - rect.top) * (tuval.height / rect.height);
                
                const dx = x - joystick.sabitMerkez.x;
                const dy = y - joystick.sabitMerkez.y;
                const mesafe = Math.hypot(dx, dy);
                const maksUzaklik = OYUN.MOBIL.JOYSTICK.YARICAP;
                
                if (mesafe > maksUzaklik) {
                    const aci = Math.atan2(dy, dx);
                    joystick.konum.x = joystick.sabitMerkez.x + Math.cos(aci) * maksUzaklik;
                    joystick.konum.y = joystick.sabitMerkez.y + Math.sin(aci) * maksUzaklik;
                } else {
                    joystick.konum = {x, y};
                }
                
                const hizX = (joystick.konum.x - joystick.sabitMerkez.x) / maksUzaklik;
                const hizY = (joystick.konum.y - joystick.sabitMerkez.y) / maksUzaklik;
                
                oyuncu.x += hizX * oyuncu.hiz * OYUN.MOBIL.JOYSTICK.HASSASIYET;
                oyuncu.y += hizY * oyuncu.hiz * OYUN.MOBIL.JOYSTICK.HASSASIYET;
                
                if (Math.abs(hizX) > 0.1) {
                    oyuncu.yon = hizX > 0 ? 1 : -1;
                }
            }
        });
    });

    tuval.addEventListener('touchend', (e) => {
        Array.from(e.changedTouches).forEach(touch => {
            if (touch.identifier === joystick.parmakID) {
                joystick.aktif = false;
                joystick.konum = {...joystick.sabitMerkez};
            }
            if (touch.identifier === atesButonu.parmakID) {
                atesButonu.aktif = false;
                mobilOtomatikAtes = false;
                if (mobilOtomatikAtesInterval) {
                    clearInterval(mobilOtomatikAtesInterval);
                    mobilOtomatikAtesInterval = null;
                }
            }
        });
    });

    mobilArayuzCiz = function() {
        joystickCiz();
        atesButonunuCiz();
    };

    window.addEventListener('resize', joystickKonumunuAyarla);
    joystickKonumunuAyarla();
}

function oyunMantiginiGuncelle() {
    if (!oyunDevamEdiyor) return;

    oyuncuyuHareketEttir();
    
    if (window.innerWidth <= 768) {
        silahKontrolEt();
    }
    
    if (silahlar.length < OYUN.SILAH.MAKS_SAYI && Math.random() < 0.01) {
        silahlar.push(silahOlustur());
    }

    dusmanYapayZekasi();
    mermileriGuncelle();
    carpismalariKontrolEt();
}

function oyunuCiz() {
    cizimAlani.clearRect(0, 0, tuval.width, tuval.height);

    cizimAlani.save();
    cizimAlani.scale(kamera.yakinlik, kamera.yakinlik);
    cizimAlani.translate(-kamera.x, -kamera.y);

    izgaraCiz();

    cizimAlani.strokeStyle = '#333';
    cizimAlani.lineWidth = 2;
    cizimAlani.strokeRect(0, 0, OYUN.ALAN.GENISLIK, OYUN.ALAN.YUKSEKLIK);

    silahlar.forEach(silah => {
        silahCiz(silah);
    });

    dusmanlar.forEach(dusman => {
        dusmanCiz(dusman);
        
        const canYuzde = dusman.can / 100;
        cizimAlani.fillStyle = '#ff0000';
        cizimAlani.fillRect(dusman.x - 20, dusman.y - dusman.yukseklik - 10, 40, 5);
        cizimAlani.fillStyle = '#808080';
        cizimAlani.fillRect(dusman.x - 20, dusman.y - dusman.yukseklik - 10, 40 * canYuzde, 5);
    });

    mermiler.forEach(mermi => {
        mermiCiz(mermi);
    });

    copAdamCiz(oyuncu.x, oyuncu.y, oyuncu.yukseklik, oyuncu.renk, oyuncu.yon, oyuncu.silahVar, oyuncuAdi, karakterAnimasyonlariniGuncelle());

    parcaciklariCiz();

    cizimAlani.restore();

    arayuzCiz();

    if (window.innerWidth <= 768) {
        mobilArayuzCiz();
    }
}

function mobilArayuzCiz() {
    const olcek = window.devicePixelRatio || 1;
    
    if (mobilKontroller.joystick.aktif) {
        cizimAlani.beginPath();
        cizimAlani.arc(
            mobilKontroller.joystick.merkez.x,
            mobilKontroller.joystick.merkez.y,
            mobilKontroller.joystick.yaricap,
            0, Math.PI * 2
        );
        cizimAlani.fillStyle = 'rgba(255, 255, 255, 0.4)';
        cizimAlani.fill();
        
        cizimAlani.beginPath();
        cizimAlani.arc(
            mobilKontroller.joystick.konum.x,
            mobilKontroller.joystick.konum.y,
            mobilKontroller.joystick.yaricap * 0.7,
            0, Math.PI * 2
        );
        cizimAlani.fillStyle = 'rgba(255, 255, 255, 0.7)';
        cizimAlani.fill();
    }
    
    cizimAlani.beginPath();
    cizimAlani.arc(
        mobilKontroller.atesButonu.x,
        mobilKontroller.atesButonu.y,
        mobilKontroller.atesButonu.yaricap,
        0, Math.PI * 2
    );
    cizimAlani.fillStyle = mobilKontroller.atesButonu.aktif ? 
        'rgba(255, 50, 50, 0.8)' : 'rgba(255, 50, 50, 0.5)';
    cizimAlani.fill();
    
    cizimAlani.fillStyle = '#ffffff';
    cizimAlani.font = 'bold 32px Arial';
    cizimAlani.textAlign = 'center';
    cizimAlani.textBaseline = 'middle';
    cizimAlani.fillText('ATEŞ', 
        mobilKontroller.atesButonu.x,
        mobilKontroller.atesButonu.y
    );
}

function oyunDongusu() {
    if (!oyunDevamEdiyor) {
        if (!document.getElementById('olumEkrani')) {
            olumEkraniGoster();
        }
        return;
    }

    const deltaTime = 1000 / 60;

    cizimAlani.clearRect(0, 0, tuval.width, tuval.height);
    
    oyunMantiginiGuncelle(deltaTime);
    kamerayiGuncelle();
    oyunuCiz();
    
    if (window.innerWidth <= 768) {
        mobilArayuzCiz();
    }

    if (oyunDevamEdiyor) {
        animasyonID = requestAnimationFrame(oyunDongusu);
    }
}

function olumEkraniGoster() {
    const eskiOlumEkrani = document.getElementById('olumEkrani');
    if (eskiOlumEkrani) eskiOlumEkrani.remove();

    const olumEkrani = document.createElement('div');
    olumEkrani.id = 'olumEkrani';
    
    const isMobile = window.innerWidth <= 768;
    const olcek = isMobile ? Math.min(window.innerWidth, window.innerHeight) / 1200 : 1;
    
    Object.assign(olumEkrani.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: '1000'
    });

    const icerik = document.createElement('div');
    Object.assign(icerik.style, {
        background: 'linear-gradient(145deg, #1a1a1a, #2a2a2a)',
        padding: `${30 * olcek}px`,
        borderRadius: '20px',
        width: isMobile ? '90%' : '400px',
        maxWidth: '500px',
        boxShadow: '0 0 50px rgba(255, 85, 85, 0.2)',
        border: '2px solid rgba(255, 85, 85, 0.3)',
        animation: 'olumEkraniGoster 0.3s ease-out'
    });

    const stil = document.createElement('style');
    stil.textContent = `
        @keyframes olumEkraniGoster {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(stil);

    const baslik = document.createElement('h2');
    baslik.textContent = 'ÖLDÜN!';
    Object.assign(baslik.style, {
        color: '#ff5555',
        fontSize: `${45 * olcek}px`,
        margin: '0 0 30px 0',
        textAlign: 'center',
        textTransform: 'uppercase',
        fontWeight: '900',
        textShadow: '0 0 20px rgba(255, 85, 85, 0.5)',
        letterSpacing: '3px'
    });

    const skorKart = document.createElement('div');
    Object.assign(skorKart.style, {
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        padding: `${20 * olcek}px`,
        marginBottom: `${25 * olcek}px`
    });

    const skorBilgileri = [
        { label: 'Skor', value: SKOR.suankiSkor },
        { label: 'En Yüksek', value: SKOR.enYuksekSkor },
        { label: 'Öldürülen', value: SKOR.oldurulenDusman }
    ];

    skorBilgileri.forEach(({ label, value }, index) => {
        const satir = document.createElement('div');
        Object.assign(satir.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: `${12 * olcek}px`,
            borderBottom: index !== skorBilgileri.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
        });

        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        Object.assign(labelEl.style, {
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: `${20 * olcek}px`
        });

        const valueEl = document.createElement('span');
        valueEl.textContent = value;
        Object.assign(valueEl.style, {
            color: '#fff',
            fontSize: `${24 * olcek}px`,
            fontWeight: 'bold'
        });

        satir.appendChild(labelEl);
        satir.appendChild(valueEl);
        skorKart.appendChild(satir);
    });

    const butonContainer = document.createElement('div');
    Object.assign(butonContainer.style, {
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '15px',
        marginTop: '20px'
    });

    const butonStili = {
        padding: `${16 * olcek}px`,
        fontSize: `${20 * olcek}px`,
        fontWeight: 'bold',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textTransform: 'uppercase',
        letterSpacing: '1px'
    };

    const yenidenBaslatButon = document.createElement('button');
    yenidenBaslatButon.textContent = 'Yeniden Başlat';
    Object.assign(yenidenBaslatButon.style, {
        ...butonStili,
        background: 'linear-gradient(45deg, #ff5555, #ff3333)',
        boxShadow: '0 4px 15px rgba(255, 85, 85, 0.3)'
    });

    const anaMenuButon = document.createElement('button');
    anaMenuButon.textContent = 'Ana Menü';
    Object.assign(anaMenuButon.style, {
        ...butonStili,
        background: 'rgba(255, 255, 255, 0.1)'
    });

    [yenidenBaslatButon, anaMenuButon].forEach(buton => {
        buton.onmouseover = () => {
            buton.style.transform = 'translateY(-2px)';
            buton.style.boxShadow = '0 6px 20px rgba(255, 85, 85, 0.4)';
        };
        buton.onmouseout = () => {
            buton.style.transform = 'translateY(0)';
            buton.style.boxShadow = '0 4px 15px rgba(255, 85, 85, 0.3)';
        };
    });

    yenidenBaslatButon.onclick = yenidenBaslat;
    anaMenuButon.onclick = () => {
        olumEkrani.remove();
        document.getElementById('girisEkrani').style.display = 'flex';
        tuval.style.display = 'none';
    };

    butonContainer.appendChild(yenidenBaslatButon);
    butonContainer.appendChild(anaMenuButon);

    icerik.appendChild(baslik);
    icerik.appendChild(skorKart);
    icerik.appendChild(butonContainer);
    olumEkrani.appendChild(icerik);
    document.body.appendChild(olumEkrani);
}

function oyunuSifirla() {
    oyuncu.x = OYUN.ALAN.GENISLIK / 2;
    oyuncu.y = OYUN.ALAN.YUKSEKLIK / 2;
    oyuncu.can = 100;
    oyuncu.silahVar = false;
    oyuncu.mermiSayisi = 0;
    
    dusmanlar = [];
    mermiler = [];
    silahlar = [];
    parcaciklar = [];
    
    SKOR.suankiSkor = 0;
    SKOR.oldurulenDusman = 0;
}

function oyunBitti() {
    oyunDevamEdiyor = false;
    
    if (mobilOtomatikAtesInterval) {
        clearInterval(mobilOtomatikAtesInterval);
        mobilOtomatikAtesInterval = null;
    }
    
    if (animasyonID) {
        cancelAnimationFrame(animasyonID);
        animasyonID = null;
    }
    
    tuval.removeEventListener('touchstart', mobilKontrolleriniEkle);
    tuval.removeEventListener('touchmove', mobilKontrolleriniEkle);
    tuval.removeEventListener('touchend', mobilKontrolleriniEkle);
    
    olumEkraniGoster();
}

function mermiOlustur(x, y, hedefX, hedefY, dusmanMermisi = false, dusmanTip = 'NORMAL') {
    const dx = hedefX - x;
    const dy = hedefY - y;
    const aci = Math.atan2(dy, dx);
    
    let mermiHiz = dusmanMermisi ? 10 : 
                   oyuncu.silahTip === 'MINIGUN' ? SILAH.MINIGUN.MERMI_HIZ : SILAH.NORMAL.MERMI_HIZ;
    
    let mermiBoyut = dusmanMermisi ? DUSMAN[dusmanTip].MERMI_BOYUT : 
                     oyuncu.silahTip === 'MINIGUN' ? SILAH.MINIGUN.MERMI_BOYUT : SILAH.NORMAL.MERMI_BOYUT;
    
    let mermiRenk = dusmanMermisi ? DUSMAN[dusmanTip].MERMI_RENK :
                    oyuncu.silahTip === 'MINIGUN' ? SILAH.MINIGUN.MERMI_RENK : SILAH.NORMAL.MERMI_RENK;

    return {
        x: x,
        y: y,
        baslangicX: x,
        baslangicY: y,
        hedefX: hedefX,
        hedefY: hedefY,
        hizX: Math.cos(aci) * mermiHiz,
        hizY: Math.sin(aci) * mermiHiz,
        boyut: mermiBoyut,
        renk: mermiRenk,
        dusmanMermisi: dusmanMermisi,
        dusmanTip: dusmanTip,
        takipEt: !dusmanMermisi
    };
}

function mermileriGuncelle() {
    for (let i = mermiler.length - 1; i >= 0; i--) {
        const mermi = mermiler[i];
        
        if (!mermi.dusmanMermisi) {
            let hedef = null;
            let enKisaMesafe = Infinity;
            
            dusmanlar.forEach(dusman => {
                const mesafe = Math.hypot(dusman.x - mermi.x, dusman.y - mermi.y);
                if (mesafe < 300 && mesafe < enKisaMesafe) {
                    enKisaMesafe = mesafe;
                    hedef = dusman;
                }
            });
            
            if (hedef) {
                const dx = hedef.x - mermi.x;
                const dy = hedef.y - mermi.y;
                const aci = Math.atan2(dy, dx);
                
                const takipGucu = oyuncu.silahTip === 'MINIGUN' ? 0.3 : 0.2;
                const mermiHiz = oyuncu.silahTip === 'MINIGUN' ? 20 : 15;
                
                mermi.hizX = Math.cos(aci) * mermiHiz;
                mermi.hizY = Math.sin(aci) * mermiHiz;
            }
        }
        
        mermi.x += mermi.hizX;
        mermi.y += mermi.hizY;
        
        if (Math.random() < 0.3) {
            parcaciklar.push({
                x: mermi.x,
                y: mermi.y,
                hizX: (Math.random() - 0.5) * 2,
                hizY: (Math.random() - 0.5) * 2,
                yasam: 0.5,
                renk: mermi.dusmanMermisi ? '#ff0000' : '#ffffff',
                boyut: 1
            });
        }
        
        const mesafe = Math.hypot(mermi.x - mermi.baslangicX, mermi.y - mermi.baslangicY);
        if (mesafe > 1000 || mermi.x < 0 || mermi.x > OYUN.ALAN.GENISLIK || mermi.y < 0 || mermi.y > OYUN.ALAN.YUKSEKLIK) {
            mermiler.splice(i, 1);
        }
    }
}

function silahOlustur() {
    const tip = Math.random() > 0.8 ? 'MINIGUN' : 'NORMAL';
    const silah = {
        x: Math.random() * (OYUN.ALAN.GENISLIK - 100) + 50,
        y: Math.random() * (OYUN.ALAN.YUKSEKLIK - 100) + 50,
        tip: tip,
        mermiSayisi: tip === 'MINIGUN' ? 200 : 30
    };

    const oyuncuMesafe = Math.hypot(silah.x - oyuncu.x, silah.y - oyuncu.y);
    if (oyuncuMesafe < 200) {
        return silahOlustur();
    }

    return silah;
}

function silahAl() {
    silahlar.forEach((silah, index) => {
        const mesafe = Math.hypot(oyuncu.x - silah.x, oyuncu.y - silah.y);
        const isMobil = window.innerWidth <= 768;
        const mesafeLimit = isMobil ? 100 : 50;
        
        if (mesafe < mesafeLimit) {
            oyuncu.silahVar = true;
            oyuncu.silahTip = silah.tip;
            oyuncu.mermiSayisi = silah.mermiSayisi;
            silahlar.splice(index, 1);
            SES.oynat(SES.ates);
            
            if (isMobil) {
                mobilKontroller.butonlar.ates.visible = true;
            }
        }
    });
}

function carpismalariKontrolEt() {
    mermiler.forEach((mermi, mermiIndex) => {
        if (mermi.dusmanMermisi) {
            const oyuncuMesafe = Math.hypot(oyuncu.x - mermi.x, oyuncu.y - mermi.y);
            if (oyuncuMesafe < oyuncu.genislik) {
                mermiler.splice(mermiIndex, 1);
                const hasar = mermi.dusmanTip === 'BOSS' ? DUSMAN.BOSS.HASAR : DUSMAN.NORMAL.HASAR;
                oyuncu.can -= hasar;
                
                kanEfektiOlustur(mermi.x, mermi.y, 'oyuncu', 16);
                
                if (oyuncu.can <= 0) {
                    kanEfektiOlustur(oyuncu.x, oyuncu.y, 'oyuncu', 24);
                    oyunBitti();
                }
            }
        } else {
            dusmanlar.forEach((dusman, dusmanIndex) => {
                const dusmanMesafe = Math.hypot(dusman.x - mermi.x, dusman.y - mermi.y);
                if (dusmanMesafe < dusman.genislik) {
                    mermiler.splice(mermiIndex, 1);
                    const hasar = oyuncu.silahTip === 'MINIGUN' ? SILAH.MINIGUN.HASAR : SILAH.NORMAL.HASAR;
                    dusman.can -= hasar;
                    kanEfektiOlustur(mermi.x, mermi.y, 'dusman', 8);
                    if (dusman.can <= 0) {
                        kanEfektiOlustur(dusman.x, dusman.y, 'dusman', 16);
                        dusmanlar.splice(dusmanIndex, 1);
                        SKOR.oldurulenDusman++;
                        SKOR.skorArttir(dusman.tip === 'BOSS' ? 100 : 10);
                    }
                }
            });
        }
    });
}

function kanEfektiOlustur(x, y, tip = 'dusman', miktar = 8) {
    const renk = tip === 'oyuncu' ? '#ff0000' : '#ffffff';
    const parcacikBoyutu = tip === 'oyuncu' ? 3 : 2;
    
    for (let i = 0; i < miktar; i++) {
        const aci = (Math.PI * 2 / miktar) * i + (Math.random() * 0.5);
        const hiz = 2 + Math.random() * 3;
        
        parcaciklar.push({
            x: x,
            y: y,
            hizX: Math.cos(aci) * hiz,
            hizY: Math.sin(aci) * hiz,
            yasam: 1,
            renk: renk,
            boyut: parcacikBoyutu + Math.random() * 2
        });
    }
}

function parcaciklariGuncelle() {
    for (let i = parcaciklar.length - 1; i >= 0; i--) {
        const parcacik = parcaciklar[i];
        
        parcacik.x += parcacik.hizX;
        parcacik.y += parcacik.hizY;
        parcacik.hizX *= 0.98;
        parcacik.hizY *= 0.98;
        parcacik.yasam -= 0.02;
        
        parcacik.hizY += 0.1;
        
        if (parcacik.yasam <= 0) {
            parcaciklar.splice(i, 1);
        }
    }
}

function parcaciklariCiz() {
    parcaciklar.forEach(parcacik => {
        cizimAlani.beginPath();
        cizimAlani.arc(parcacik.x, parcacik.y, parcacik.boyut, 0, Math.PI * 2);
        cizimAlani.fillStyle = `${parcacik.renk}${Math.floor(parcacik.yasam * 255).toString(16).padStart(2, '0')}`;
        cizimAlani.fill();
    });
}

function miniHaritaCiz() {
    const haritaBoyut = OYUN.MOBIL.MINI_HARITA_BOYUT;
    const kenarUzaklik = 20;
    const x = tuval.width - haritaBoyut - kenarUzaklik;
    const y = kenarUzaklik * 2 + 130 * OYUN.MOBIL.ARAYUZ_OLCEK;
    const olcek = haritaBoyut / OYUN.ALAN.GENISLIK;
    
    cizimAlani.fillStyle = 'rgba(0, 0, 0, 0.7)';
    cizimAlani.fillRect(x, y, haritaBoyut, haritaBoyut);
    
    cizimAlani.strokeStyle = '#333';
    cizimAlani.strokeRect(x, y, haritaBoyut, haritaBoyut);
    
    cizimAlani.fillStyle = '#ffffff';
    cizimAlani.fillRect(x + oyuncu.x * olcek - 4, y + oyuncu.y * olcek - 4, 8, 8);
    
    cizimAlani.fillStyle = '#ff0000';
    dusmanlar.forEach(dusman => {
        cizimAlani.fillRect(x + dusman.x * olcek - 3, y + dusman.y * olcek - 3, 6, 6);
    });
    
    cizimAlani.fillStyle = '#ffff00';
    silahlar.forEach(silah => {
        cizimAlani.fillRect(x + silah.x * olcek - 2, y + silah.y * olcek - 2, 4, 4);
    });
    
    cizimAlani.strokeStyle = '#ffffff';
    cizimAlani.lineWidth = 2;
    cizimAlani.strokeRect(
        x + (kamera.x * olcek),
        y + (kamera.y * olcek),
        (tuval.width / kamera.yakinlik) * olcek,
        (tuval.height / kamera.yakinlik) * olcek
    );
}

function otomatikAtes() {
    if (!oyuncu.silahVar || oyuncu.mermiSayisi <= 0) return;
    
    let enYakinDusman = null;
    let enKisaMesafe = Infinity;
    
    dusmanlar.forEach(dusman => {
        const mesafe = Math.hypot(dusman.x - oyuncu.x, dusman.y - oyuncu.y);
        if (mesafe < enKisaMesafe) {
            enKisaMesafe = mesafe;
            enYakinDusman = dusman;
        }
    });
    
    if (enYakinDusman) {
        mermiOlustur(oyuncu.x, oyuncu.y, enYakinDusman.x, enYakinDusman.y);
        oyuncu.mermiSayisi--;
        SES.oynat(SES.ates);
        
        if (oyuncu.mermiSayisi <= 0) {
            oyuncu.silahVar = false;
        }
    }
}

function oyunaBasla() {
    const ad = document.getElementById('kullaniciAdi').value.trim();
    if (!ad) {
        alert('Lütfen bir kullanıcı adı girin!');
        return;
    }
    
    oyuncuAdi = ad;
    document.getElementById('girisEkrani').style.display = 'none';
    tuval.style.display = 'block';

    canvasiBoyutlandir();
    window.addEventListener('resize', canvasiBoyutlandir);

    oyuncu.x = OYUN.ALAN.GENISLIK / 2;
    oyuncu.y = OYUN.ALAN.YUKSEKLIK / 2;
    oyuncu.can = 100;
    oyuncu.silahVar = false;
    oyuncu.mermiSayisi = 0;

    dusmanlar = [];
    silahlar = [];
    
    for(let i = 0; i < OYUN.DUSMAN.SAYI; i++) {
        dusmanlar.push(dusmanOlustur('NORMAL'));
    }
    
    for(let i = 0; i < OYUN.SILAH.MAKS_SAYI; i++) {
        silahlar.push(silahOlustur());
    }

    if (window.innerWidth <= 768) {
        mobilKontrolleriniEkle();
    } else {
        masaustuKontrolleriniEkle();
    }

    oyunDevamEdiyor = true;
    kamerayiGuncelle();
    oyunDongusu();
}

function arayuzCiz() {
    const isMobil = window.innerWidth <= 768;
    
    cizimAlani.save();
    cizimAlani.setTransform(1, 0, 0, 1, 0, 0);
    
    if (isMobil) {

        const olcek = Math.min(window.innerWidth, window.innerHeight) / 800;
        const panelGenislik = 160 * olcek;
        const panelYukseklik = 120 * olcek;
        const kenarBosluk = 15 * olcek;
        const yaziBoyu = 18 * olcek; 
        const satirAraligi = 24 * olcek; 

        cizimAlani.fillStyle = 'rgba(0, 0, 0, 0.6)';
        cizimAlani.fillRect(kenarBosluk, kenarBosluk, panelGenislik, panelYukseklik);

        cizimAlani.fillStyle = '#ffffff';
        cizimAlani.font = `bold ${yaziBoyu}px Arial`;
        cizimAlani.textAlign = 'left';
        cizimAlani.textBaseline = 'top';

        const yBaslangic = kenarBosluk + 8 * olcek;
        const xBaslangic = kenarBosluk + 8 * olcek;
        
        cizimAlani.fillText(`Can: ${Math.ceil(oyuncu.can)}`, xBaslangic, yBaslangic);
        cizimAlani.fillText(`Mermi: ${oyuncu.mermiSayisi}`, xBaslangic, yBaslangic + satirAraligi);
        cizimAlani.fillText(`Skor: ${SKOR.suankiSkor}`, xBaslangic, yBaslangic + satirAraligi * 2);
        cizimAlani.fillText(`Öld: ${SKOR.oldurulenDusman}`, xBaslangic, yBaslangic + satirAraligi * 3);
    } else {
        cizimAlani.fillStyle = 'rgba(0, 0, 0, 0.5)';
        cizimAlani.fillRect(10, 10, 200, 130);
        
        cizimAlani.fillStyle = '#ffffff';
        cizimAlani.font = 'bold 24px Arial';
        cizimAlani.textAlign = 'left';
        cizimAlani.textBaseline = 'top';
        
        cizimAlani.fillText(`Can: ${Math.ceil(oyuncu.can)}`, 20, 20);
        cizimAlani.fillText(`Mermi: ${oyuncu.mermiSayisi}`, 20, 50);
        cizimAlani.fillText(`Skor: ${SKOR.suankiSkor}`, 20, 80);
        cizimAlani.fillText(`Öldürülen: ${SKOR.oldurulenDusman}`, 20, 110);
    }
    
    cizimAlani.restore();
}

function izgaraCiz() {
    const izgaraBoyutu = 200;
    cizimAlani.strokeStyle = '#222';
    cizimAlani.lineWidth = 2;
    
    for (let x = 0; x < OYUN.ALAN.GENISLIK; x += izgaraBoyutu) {
        cizimAlani.beginPath();
        cizimAlani.moveTo(x, 0);
        cizimAlani.lineTo(x, OYUN.ALAN.YUKSEKLIK);
        cizimAlani.stroke();
    }
    
    for (let y = 0; y < OYUN.ALAN.YUKSEKLIK; y += izgaraBoyutu) {
        cizimAlani.beginPath();
        cizimAlani.moveTo(0, y);
        cizimAlani.lineTo(OYUN.ALAN.GENISLIK, y);
        cizimAlani.stroke();
    }
}

function atesEt(e) {
    if (!oyuncu.silahVar || oyuncu.mermiSayisi <= 0) return;

    const simdikiZaman = Date.now();
    const atesAraligi = oyuncu.silahTip === 'MINIGUN' ? SILAH.MINIGUN.ATES_HIZI : SILAH.NORMAL.ATES_HIZI;

    if (simdikiZaman - sonAtesZamani > atesAraligi) {
        const rect = tuval.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (tuval.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (tuval.height / rect.height);
        
        const hedefX = mouseX / kamera.yakinlik + kamera.x;
        const hedefY = mouseY / kamera.yakinlik + kamera.y;

        const mermi = mermiOlustur(oyuncu.x, oyuncu.y, hedefX, hedefY);
        mermiler.push(mermi);
        oyuncu.mermiSayisi--;
        sonAtesZamani = simdikiZaman;
        SES.oynat(SES.ates);

        kanEfektiOlustur(oyuncu.x, oyuncu.y, '#ffff00', 4);

        if (oyuncu.mermiSayisi <= 0) {
            oyuncu.silahVar = false;
            mouseBasili = false;
        }
    }
}

function npcOlustur() {
    let x, y;
    let gecerliPozisyon = false;
    
    while (!gecerliPozisyon) {
        x = Math.random() * OYUN.ALAN.GENISLIK;
        y = Math.random() * OYUN.ALAN.YUKSEKLIK;
        
        const oyuncuMesafe = Math.hypot(x - oyuncu.x, y - oyuncu.y);
        if (oyuncuMesafe < 500) continue;
        
        gecerliPozisyon = true;
        for (const dusman of dusmanlar) {
            const dusmanMesafe = Math.hypot(x - dusman.x, y - dusman.y);
            if (dusmanMesafe < 200) {
                gecerliPozisyon = false;
                break;
            }
        }
    }

    dusmanlar.push({
        x: x,
        y: y,
        genislik: 10,
        yukseklik: 40,
        hiz: OYUN.DUSMAN.HIZ + (Math.random() * 0.5 - 0.25), 
        can: 100,
        yon: 1,
        silahVar: true,
        sonAtesZamani: Date.now() + Math.random() * 2000,
        atesAraligi: OYUN.DUSMAN.ATES_SURESI + Math.random() * 1000,
        renk: '#ff0000'
    });
}

function yenidenBaslat() {
    const olumEkrani = document.getElementById('olumEkrani');
    if (olumEkrani) {
        olumEkrani.remove();
    }

    if (mobilOtomatikAtesInterval) {
        clearInterval(mobilOtomatikAtesInterval);
        mobilOtomatikAtesInterval = null;
    }
    if (animasyonID) {
        cancelAnimationFrame(animasyonID);
        animasyonID = null;
    }

    oyunDevamEdiyor = false;
    mouseBasili = false;
    sonAtesZamani = 0;
    animasyonZamani = 0;
    mobilOtomatikAtes = false;

    oyuncu.x = OYUN.ALAN.GENISLIK / 2;
    oyuncu.y = OYUN.ALAN.YUKSEKLIK / 2;
    oyuncu.can = 100;
    oyuncu.silahVar = false;
    oyuncu.mermiSayisi = 0;
    oyuncu.hiz = 5;
    oyuncu.yon = 1;

    dusmanlar = [];
    silahlar = [];
    mermiler = [];
    parcaciklar = [];
    
    SKOR.suankiSkor = 0;
    SKOR.oldurulenDusman = 0;
    
    kamera.x = 0;
    kamera.y = 0;
    kamera.yakinlik = window.innerWidth <= 768 ? OYUN.MOBIL.YAKINLIK : 1;
    
    canvasiBoyutlandir();
    
    for(let i = 0; i < OYUN.DUSMAN.SAYI; i++) {
        const dusman = dusmanOlustur('NORMAL');
        dusman.hiz = OYUN.DUSMAN.HIZ;
        dusmanlar.push(dusman);
    }
    
    for(let i = 0; i < OYUN.SILAH.MAKS_SAYI; i++) {
        silahlar.push(silahOlustur());
    }
    
    if (window.innerWidth <= 768) {
        mobilKontrolleriniEkle();
    } else {
        masaustuKontrolleriniEkle();
    }
    
    oyunDevamEdiyor = true;
    
    if (animasyonID) {
        cancelAnimationFrame(animasyonID);
    }
    animasyonID = requestAnimationFrame(oyunDongusu);
}

function dusmanYapayZekasi() {
    let bossVarMi = false;
    
    dusmanlar.forEach((dusman, index) => {
        if (dusman.tip === 'BOSS') bossVarMi = true;
        
        const dx = oyuncu.x - dusman.x;
        const dy = oyuncu.y - dusman.y;
        const mesafe = Math.hypot(dx, dy);
        
        if (mesafe < OYUN.DUSMAN.GORUS_MESAFESI) {
            const aci = Math.atan2(dy, dx);
            
            if (mesafe > 200) {
                dusman.x += Math.cos(aci) * dusman.hiz;
                dusman.y += Math.sin(aci) * dusman.hiz;
            } else if (mesafe < 150) {
                dusman.x -= Math.cos(aci) * dusman.hiz;
                dusman.y -= Math.sin(aci) * dusman.hiz;
            }
            
            const simdikiZaman = Date.now();
            if (simdikiZaman - dusman.sonAtesZamani > dusman.atesAraligi) {
                const mermi = mermiOlustur(
                    dusman.x, 
                    dusman.y, 
                    oyuncu.x, 
                    oyuncu.y, 
                    true, 
                    dusman.tip
                );
                mermiler.push(mermi);
                dusman.sonAtesZamani = simdikiZaman;
                
                if (dusman.tip === 'BOSS') {
                    dusman.atesAraligi = OYUN.DUSMAN.ATES_SURESI * 0.75;
                }
            }
        }
        
        dusman.x = Math.max(dusman.genislik, Math.min(OYUN.ALAN.GENISLIK - dusman.genislik, dusman.x));
        dusman.y = Math.max(dusman.yukseklik, Math.min(OYUN.ALAN.YUKSEKLIK - dusman.yukseklik, dusman.y));
        
        dusman.yon = dx > 0 ? 1 : -1;
    });
    
    const normalDusmanSayisi = dusmanlar.filter(d => d.tip === 'NORMAL').length;
    if (normalDusmanSayisi < OYUN.DUSMAN.SAYI) {
        dusmanlar.push(dusmanOlustur('NORMAL'));
    }
    
    if (!bossVarMi && Math.random() < 0.005) {
        dusmanlar.push(dusmanOlustur('BOSS'));
    }
}

function oyuncuyuHareketEttir() {
    if (window.innerWidth <= 768) {
        if (mobilKontroller.joystick.aktif) {
            const hizCarpani = OYUN.MOBIL.HASSASIYET;
            oyuncu.x += mobilKontroller.joystick.delta.x * oyuncu.hiz * hizCarpani;
            oyuncu.y += mobilKontroller.joystick.delta.y * oyuncu.hiz * hizCarpani;
            
            if (Math.abs(mobilKontroller.joystick.delta.x) > 0.1) {
                oyuncu.yon = mobilKontroller.joystick.delta.x > 0 ? 1 : -1;
            }
        }
    } else {
        if (tuslar.sol) oyuncu.x -= oyuncu.hiz;
        if (tuslar.sag) oyuncu.x += oyuncu.hiz;
        if (tuslar.yukari) oyuncu.y -= oyuncu.hiz;
        if (tuslar.asagi) oyuncu.y += oyuncu.hiz;
    }
    
    oyuncu.x = Math.max(oyuncu.genislik, Math.min(OYUN.ALAN.GENISLIK - oyuncu.genislik, oyuncu.x));
    oyuncu.y = Math.max(oyuncu.yukseklik, Math.min(OYUN.ALAN.YUKSEKLIK - oyuncu.yukseklik, oyuncu.y));
}

function mobilAkilliAtes() {
    if (!oyuncu.silahVar || oyuncu.mermiSayisi <= 0) return;

    let enYakinDusman = null;
    let enKisaMesafe = Infinity;

    dusmanlar.forEach(dusman => {
        const mesafe = Math.hypot(dusman.x - oyuncu.x, dusman.y - oyuncu.y);
        if (mesafe < 500 && mesafe < enKisaMesafe) {
            enKisaMesafe = mesafe;
            enYakinDusman = dusman;
        }
    });

    if (enYakinDusman) {
        const tahminX = enYakinDusman.x + (enYakinDusman.hizX || 0) * 10;
        const tahminY = enYakinDusman.y + (enYakinDusman.hizY || 0) * 10;
        
        const mermi = mermiOlustur(oyuncu.x, oyuncu.y, tahminX, tahminY);
        mermiler.push(mermi);
        oyuncu.mermiSayisi--;
        SES.oynat(SES.ates);

        if (oyuncu.mermiSayisi <= 0) {
            oyuncu.silahVar = false;
            if (mobilOtomatikAtesInterval) {
                clearInterval(mobilOtomatikAtesInterval);
                mobilOtomatikAtesInterval = null;
            }
        }
    }
}

function dusmanCiz(dusman) {
    if (dusman.tip === 'BOSS') {
        const x = dusman.x;
        const y = dusman.y;
        const genislik = dusman.genislik;
        const yukseklik = dusman.yukseklik;
        
        cizimAlani.fillStyle = '#ff0000';
        cizimAlani.font = 'bold 20px Arial';
        cizimAlani.textAlign = 'center';
        cizimAlani.fillText(DUSMAN.BOSS.ISIM, x, y - yukseklik - 20);
        
        cizimAlani.strokeStyle = '#990000';
        cizimAlani.lineWidth = 8;
        
        cizimAlani.beginPath();
        cizimAlani.moveTo(x, y);
        cizimAlani.lineTo(x - genislik/2, y + yukseklik/2);
        cizimAlani.moveTo(x, y);
        cizimAlani.lineTo(x + genislik/2, y + yukseklik/2);
        cizimAlani.stroke();
        
        cizimAlani.beginPath();
        cizimAlani.moveTo(x, y - yukseklik/4);
        cizimAlani.lineTo(x - genislik, y);
        cizimAlani.moveTo(x, y - yukseklik/4);
        cizimAlani.lineTo(x + genislik, y);
        cizimAlani.stroke();
        
        cizimAlani.beginPath();
        cizimAlani.moveTo(x, y - yukseklik/2);
        cizimAlani.lineTo(x, y);
        cizimAlani.stroke();
        
        cizimAlani.fillStyle = '#ffffff';
        cizimAlani.beginPath();
        cizimAlani.arc(x, y - yukseklik/2, genislik/2, 0, Math.PI * 2);
        cizimAlani.fill();
        cizimAlani.stroke();
        
        cizimAlani.fillStyle = '#00ff00';
        cizimAlani.beginPath();
        cizimAlani.arc(x, y - yukseklik/2 - genislik/4, genislik/2, 0, Math.PI, true);
        cizimAlani.fill();
        
        cizimAlani.fillStyle = '#ff0000';
        cizimAlani.beginPath();
        cizimAlani.arc(x, y - yukseklik/2 + genislik/6, genislik/4, 0, Math.PI, false);
        cizimAlani.fill();
        
        cizimAlani.fillStyle = '#000000';
        cizimAlani.beginPath();
        cizimAlani.arc(x - genislik/6, y - yukseklik/2, genislik/8, 0, Math.PI * 2);
        cizimAlani.arc(x + genislik/6, y - yukseklik/2, genislik/8, 0, Math.PI * 2);
        cizimAlani.fill();
        
        const silahUzunluk = genislik * 2;
        const silahGenislik = genislik / 2;
        const silahY = y - yukseklik/4;
        
        cizimAlani.fillStyle = '#333';
        cizimAlani.fillRect(
            x + (genislik/2 * dusman.yon),
            silahY - silahGenislik/2,
            silahUzunluk * dusman.yon,
            silahGenislik
        );
        
        cizimAlani.fillStyle = '#222';
        cizimAlani.fillRect(
            x + ((genislik/2 + silahUzunluk) * dusman.yon),
            silahY - silahGenislik/4,
            (silahUzunluk/2) * dusman.yon,
            silahGenislik/2
        );
        
        cizimAlani.fillStyle = '#ff0000';
        cizimAlani.fillRect(
            x + (genislik/2 * dusman.yon),
            silahY + silahGenislik/2,
            (silahUzunluk/3) * dusman.yon,
            silahGenislik/4
        );
        
    } else {
        copAdamCiz(dusman.x, dusman.y, dusman.yukseklik, DUSMAN.NORMAL.RENK, dusman.yon, true);
    }
}

function silahCiz(silah) {
    const genislik = 40;
    const yukseklik = 20;
    
    cizimAlani.save();
    cizimAlani.globalAlpha = 0.3;
    cizimAlani.beginPath();
    cizimAlani.arc(silah.x, silah.y, 60, 0, Math.PI * 2);
    cizimAlani.fillStyle = silah.tip === 'MINIGUN' ? '#ff3333' : '#ffffff';
    cizimAlani.fill();
    cizimAlani.restore();
    
    if (silah.tip === 'MINIGUN') {
        cizimAlani.fillStyle = SILAH.MINIGUN.SILAH_RENK;
        cizimAlani.fillRect(silah.x - genislik/2, silah.y - yukseklik/2, genislik, yukseklik);
        
        cizimAlani.fillStyle = '#990000';
        cizimAlani.fillRect(silah.x + genislik/2, silah.y - yukseklik/4, genislik/2, yukseklik/2);
        
        cizimAlani.fillStyle = '#ffff00';
        cizimAlani.fillRect(silah.x - genislik/2, silah.y + yukseklik/2, genislik/3, yukseklik/3);
    } else {
        cizimAlani.fillStyle = SILAH.NORMAL.SILAH_RENK;
        cizimAlani.fillRect(silah.x - genislik/2, silah.y - yukseklik/2, genislik, yukseklik);
    }
    
    cizimAlani.fillStyle = '#ffffff';
    cizimAlani.font = '16px Arial';
    cizimAlani.textAlign = 'center';
    cizimAlani.fillText(silah.mermiSayisi, silah.x, silah.y - yukseklik);
}

function mermiCiz(mermi) {
    cizimAlani.beginPath();
    cizimAlani.arc(mermi.x, mermi.y, mermi.boyut, 0, Math.PI * 2);
    cizimAlani.fillStyle = mermi.renk;
    cizimAlani.fill();
}

function dusmanOlustur(tip = 'NORMAL') {
    const dusman = {
        x: 0,
        y: 0,
        genislik: DUSMAN[tip].BOYUT.w,
        yukseklik: DUSMAN[tip].BOYUT.h,
        hiz: DUSMAN[tip].HIZ,
        can: DUSMAN[tip].CAN,
        yon: 1,
        tip: tip,
        sonAtesZamani: Date.now(),
        atesAraligi: OYUN.DUSMAN.ATES_SURESI
    };

    const kenar = Math.floor(Math.random() * 4);
    switch(kenar) {
        case 0:
            dusman.x = Math.random() * OYUN.ALAN.GENISLIK;
            dusman.y = -dusman.yukseklik;
            break;
        case 1:
            dusman.x = OYUN.ALAN.GENISLIK + dusman.genislik;
            dusman.y = Math.random() * OYUN.ALAN.YUKSEKLIK;
            break;
        case 2:
            dusman.x = Math.random() * OYUN.ALAN.GENISLIK;
            dusman.y = OYUN.ALAN.YUKSEKLIK + dusman.yukseklik;
            break;
        case 3:
            dusman.x = -dusman.genislik;
            dusman.y = Math.random() * OYUN.ALAN.YUKSEKLIK;
            break;
    }
    return dusman;
}

function karakterAnimasyonlariniGuncelle() {
    animasyonZamani += ANIMASYON.YURUME_HIZI;
    kafaDonmeAcisi += ANIMASYON.KAFA_DONME;
    
    const bacakSallanma = Math.sin(animasyonZamani) * ANIMASYON.SALLANMA_MIKTARI;
    const kolSallanma = Math.cos(animasyonZamani) * ANIMASYON.SALLANMA_MIKTARI;
    
    return { bacakSallanma, kolSallanma, kafaDonme: Math.sin(kafaDonmeAcisi) };
}

function mobilAtesSisteminiGuncelle() {
    const atesButonu = document.getElementById('mobilAtesButonu');
    if (!atesButonu) return;

    atesButonu.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!oyuncu.silahVar || oyuncu.mermiSayisi <= 0) return;

        if (oyuncu.silahTip === 'MINIGUN') {
            mobilOtomatikAtes = true;
            mobilAtesInterval = setInterval(() => {
                if (mobilOtomatikAtes) {
                    mobilAkilliAtes();
                }
            }, SILAH.MINIGUN.ATES_HIZI);
        } else {
            mobilAkilliAtes();
        }
    });

    atesButonu.addEventListener('touchend', () => {
        mobilOtomatikAtes = false;
        if (mobilAtesInterval) {
            clearInterval(mobilAtesInterval);
            mobilAtesInterval = null;
        }
    });
}

function dunyaKonumundanEkranKonumuna(x, y) {
    return {
        x: (x - kamera.x) * kamera.yakinlik,
        y: (y - kamera.y) * kamera.yakinlik
    };
}

function mobilKontrolleriGuncelle() {
    if (!window.innerWidth <= 768) return;

    const tuvalGenislik = tuval.width;
    const tuvalYukseklik = tuval.height;

    OYUN.MOBIL.JOYSTICK.KONUM.Y = tuvalYukseklik * 0.8;

    OYUN.MOBIL.ATES.KONUM.X = tuvalGenislik * 0.85;
    OYUN.MOBIL.ATES.KONUM.Y = tuvalYukseklik * 0.8;

    const olcek = Math.min(tuvalGenislik, tuvalYukseklik) / 1000;
    OYUN.MOBIL.JOYSTICK.YARICAP = 60 * olcek;
    OYUN.MOBIL.ATES.YARICAP = 50 * olcek;
}