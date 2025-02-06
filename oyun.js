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
    genislik: 10,
    yukseklik: 40,
    hiz: 5,
    can: 100,
    silahVar: false,
    mermiSayisi: 0,
    yon: 1,
    renk: '#ffffff',
    aci: 0
};

let dusmanlar = [];
let mermiler = [];
let silahlar = [];
let parcaciklar = [];

let oyunDevamEdiyor = false;
let oyuncuAdi = '';

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

function canvasiBoyutlandir() {
    const olcek = window.devicePixelRatio || 1;
    const isMobil = window.innerWidth <= 768;
    
    tuval.width = window.innerWidth * olcek;
    tuval.height = window.innerHeight * olcek;
    tuval.style.width = window.innerWidth + 'px';
    tuval.style.height = window.innerHeight + 'px';
    
    if (isMobil) {
        mobilKontroller.joystick.yaricap = OYUN.MOBIL.JOYSTICK_BOYUT / 2;
        mobilKontroller.joystick.merkez = {
            x: OYUN.MOBIL.JOYSTICK_BOYUT,
            y: tuval.height - OYUN.MOBIL.JOYSTICK_BOYUT * 1.2
        };
        
        mobilKontroller.atesButonu = {
            x: tuval.width - OYUN.MOBIL.ATES_BUTON_BOYUT,
            y: tuval.height - OYUN.MOBIL.ATES_BUTON_BOYUT * 1.2,
            yaricap: OYUN.MOBIL.ATES_BUTON_BOYUT / 2,
            aktif: false
        };
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

function copAdamCiz(x, y, yukseklik, renk, yon, silahVar, isim = '') {
    const genislik = yukseklik / 4;
    cizimAlani.strokeStyle = renk;
    cizimAlani.lineWidth = 2;
    
    cizimAlani.beginPath();
    cizimAlani.moveTo(x, y - yukseklik/2);
    cizimAlani.lineTo(x, y + yukseklik/2);
    cizimAlani.stroke();
    
    cizimAlani.beginPath();
    cizimAlani.arc(x, y - yukseklik/2, genislik, 0, Math.PI * 2);
    cizimAlani.stroke();
    
    cizimAlani.beginPath();
    cizimAlani.moveTo(x - genislik, y - yukseklik/4);
    cizimAlani.lineTo(x + genislik, y - yukseklik/4);
    cizimAlani.stroke();
    
    cizimAlani.beginPath();
    cizimAlani.moveTo(x, y + yukseklik/2);
    cizimAlani.lineTo(x - genislik, y + yukseklik);
    cizimAlani.moveTo(x, y + yukseklik/2);
    cizimAlani.lineTo(x + genislik, y + yukseklik);
    cizimAlani.stroke();
    
    if (silahVar) {
        cizimAlani.beginPath();
        cizimAlani.moveTo(x, y - yukseklik/4);
        cizimAlani.lineTo(x + (yon * genislik * 2), y - yukseklik/4);
        cizimAlani.stroke();
    }

    if (isim) {
        cizimAlani.fillStyle = renk;
        cizimAlani.font = '16px Arial';
        cizimAlani.textAlign = 'center';
        cizimAlani.textBaseline = 'bottom';
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
            if (oyuncu.silahVar && oyuncu.mermiSayisi > 0) {
                const rect = tuval.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left) * (tuval.width / rect.width);
                const mouseY = (e.clientY - rect.top) * (tuval.height / rect.height);
                
                const hedefX = mouseX / kamera.yakinlik + kamera.x;
                const hedefY = mouseY / kamera.yakinlik + kamera.y;
                
                atesEt(hedefX, hedefY);
            }
        }
    });
}

function mobilKontrolleriniEkle() {
    let sonAtesZamani = 0;
    const ATES_GECIKMESI = 200;

    tuval.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = tuval.getBoundingClientRect();
        const olcek = tuval.width / rect.width;
        
        Array.from(e.touches).forEach(touch => {
            const x = (touch.clientX - rect.left) * olcek;
            const y = (touch.clientY - rect.top) * olcek;
            
            if (x < tuval.width / 2) {
                mobilKontroller.joystick.aktif = true;
                mobilKontroller.joystick.merkez = { x, y };
                mobilKontroller.joystick.konum = { x, y };
                mobilKontroller.joystick.touchId = touch.identifier;
            }
            else {
                const dx = x - mobilKontroller.atesButonu.x;
                const dy = y - mobilKontroller.atesButonu.y;
                if (Math.hypot(dx, dy) < mobilKontroller.atesButonu.yaricap * 1.5) {
                    mobilKontroller.atesButonu.aktif = true;
                    mobilKontroller.atesButonu.touchId = touch.identifier;
                }
            }
        });

        if (mobilKontroller.butonlar.ates.visible) {
            const atesButonMesafe = Math.hypot(
                x - mobilKontroller.butonlar.ates.x,
                y - mobilKontroller.butonlar.ates.y
            );

            if (atesButonMesafe < mobilKontroller.butonlar.ates.radius) {
                mobilAkilliAtes();
            }
        }
    });

    setInterval(() => {
        if (mobilKontroller.atesButonu.aktif && oyunDevamEdiyor) {
            const simdikiZaman = Date.now();
            if (simdikiZaman - sonAtesZamani >= ATES_GECIKMESI) {
                otomatikAtes();
                sonAtesZamani = simdikiZamani;
            }
        }
    }, 50);

    tuval.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = tuval.getBoundingClientRect();
        const olcek = tuval.width / rect.width;
        
        Array.from(e.touches).forEach(touch => {
            const x = (touch.clientX - rect.left) * olcek;
            const y = (touch.clientY - rect.top) * olcek;
            
            if (mobilKontroller.joystick.aktif && touch.identifier === mobilKontroller.joystick.touchId) {
                const dx = x - mobilKontroller.joystick.merkez.x;
                const dy = y - mobilKontroller.joystick.merkez.y;
                const mesafe = Math.hypot(dx, dy);
                const maksUzaklik = mobilKontroller.joystick.yaricap;
                
                if (mesafe > maksUzaklik) {
                    const aci = Math.atan2(dy, dx);
                    mobilKontroller.joystick.konum = {
                        x: mobilKontroller.joystick.merkez.x + Math.cos(aci) * maksUzaklik,
                        y: mobilKontroller.joystick.merkez.y + Math.sin(aci) * maksUzaklik
                    };
                } else {
                    mobilKontroller.joystick.konum = { x, y };
                }
                
                mobilKontroller.joystick.delta = {
                    x: (mobilKontroller.joystick.konum.x - mobilKontroller.joystick.merkez.x) / maksUzaklik,
                    y: (mobilKontroller.joystick.konum.y - mobilKontroller.joystick.merkez.y) / maksUzaklik
                };
            }
        });
    });

    tuval.addEventListener('touchend', (e) => {
        Array.from(e.changedTouches).forEach(touch => {
            if (touch.identifier === mobilKontroller.joystick.touchId) {
                mobilKontroller.joystick.aktif = false;
                mobilKontroller.joystick.delta = { x: 0, y: 0 };
            }
            if (touch.identifier === mobilKontroller.atesButonu.touchId) {
                mobilKontroller.atesButonu.aktif = false;
            }
        });
    });
}

function oyunMantiginiGuncelle() {
    if (!oyunDevamEdiyor) return;

    oyuncuyuHareketEttir();
    
    if (window.innerWidth <= 768) {
        silahlar.forEach((silah, index) => {
            const mesafe = Math.hypot(oyuncu.x - silah.x, oyuncu.y - silah.y);
            if (mesafe < 70) {
                oyuncu.silahVar = true;
                oyuncu.mermiSayisi += 30;
                silahlar.splice(index, 1);
                SES.oynat(SES.ates);
                mobilKontroller.butonlar.ates.visible = true;
            }
        });
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
        cizimAlani.fillStyle = '#666';
        cizimAlani.fillRect(silah.x - 10, silah.y - 5, 20, 10);
    });

    dusmanlar.forEach(dusman => {
        copAdamCiz(dusman.x, dusman.y, dusman.yukseklik, dusman.renk, dusman.yon, dusman.silahVar);
        
        const canYuzde = dusman.can / 100;
        cizimAlani.fillStyle = '#ff0000';
        cizimAlani.fillRect(dusman.x - 20, dusman.y - dusman.yukseklik - 10, 40, 5);
        cizimAlani.fillStyle = '#808080';
        cizimAlani.fillRect(dusman.x - 20, dusman.y - dusman.yukseklik - 10, 40 * canYuzde, 5);
    });

    mermiler.forEach(mermi => {
        cizimAlani.beginPath();
        cizimAlani.arc(mermi.x, mermi.y, 3, 0, Math.PI * 2);
        cizimAlani.fillStyle = mermi.dusmanMermisi ? '#ff0000' : '#ffffff';
        cizimAlani.fill();
    });

    copAdamCiz(oyuncu.x, oyuncu.y, oyuncu.yukseklik, oyuncu.renk, oyuncu.yon, oyuncu.silahVar, oyuncuAdi);

    parcaciklar.forEach(parcacik => {
        cizimAlani.beginPath();
        cizimAlani.arc(parcacik.x, parcacik.y, 2, 0, Math.PI * 2);
        cizimAlani.fillStyle = `${parcacik.renk}${Math.floor(parcacik.yasam * 255).toString(16).padStart(2, '0')}`;
        cizimAlani.fill();
    });

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
    cizimAlani.clearRect(0, 0, tuval.width, tuval.height);

    if (oyunDevamEdiyor) {
        oyunMantiginiGuncelle();
        kamerayiGuncelle();
        oyunuCiz();
        parcaciklariGuncelle();
        animasyonID = requestAnimationFrame(oyunDongusu);
    } else {
        olumEkraniCiz();
        animasyonID = requestAnimationFrame(oyunDongusu);
    }
}

function olumEkraniCiz() {
    cizimAlani.fillStyle = 'rgba(0, 0, 0, 0.8)';
    cizimAlani.fillRect(0, 0, tuval.width, tuval.height);

    cizimAlani.fillStyle = '#ff3333';
    cizimAlani.font = 'bold 72px Arial';
    cizimAlani.textAlign = 'center';
    cizimAlani.textBaseline = 'middle';
    cizimAlani.fillText('ÖLDÜN!', tuval.width/2, tuval.height/2 - 100);

    cizimAlani.fillStyle = '#ffffff';
    cizimAlani.font = '32px Arial';
    cizimAlani.fillText(`Skor: ${SKOR.suankiSkor}`, tuval.width/2, tuval.height/2);
    cizimAlani.fillText(`En Yüksek Skor: ${SKOR.enYuksekSkor}`, tuval.width/2, tuval.height/2 + 50);
    cizimAlani.fillText(`Öldürülen Düşman: ${SKOR.oldurulenDusman}`, tuval.width/2, tuval.height/2 + 100);

    const alpha = (Math.sin(Date.now() / 500) + 1) / 2;
    cizimAlani.globalAlpha = 0.5 + (alpha * 0.5);
    cizimAlani.font = 'bold 36px Arial';
    cizimAlani.fillText('Yeniden başlamak için ekrana tıkla', tuval.width/2, tuval.height/2 + 180);
    cizimAlani.globalAlpha = 1;
}

function oyunBitti() {
    oyunDevamEdiyor = false;
    SES.oynat(SES.ates);
    reklamGoster();
}

function mermiOlustur(baslangicX, baslangicY, hedefX, hedefY, dusmanMermisiMi = false) {
    const aci = Math.atan2(hedefY - baslangicY, hedefX - baslangicX);
    mermiler.push({
        x: baslangicX,
        y: baslangicY,
        hiz: 10,
        aci: aci,
        dusmanMermisi: dusmanMermisiMi
    });
}

function mermileriGuncelle() {
    for (let i = mermiler.length - 1; i >= 0; i--) {
        const mermi = mermiler[i];
        
        mermi.x += Math.cos(mermi.aci) * mermi.hiz;
        mermi.y += Math.sin(mermi.aci) * mermi.hiz;
        
        if (mermi.x < 0 || mermi.x > OYUN.ALAN.GENISLIK || 
            mermi.y < 0 || mermi.y > OYUN.ALAN.YUKSEKLIK) {
            mermiler.splice(i, 1);
        }
    }
}

function silahOlustur() {
    if (silahlar.length < OYUN.SILAH.MAKS_SAYI) {
        silahlar.push({
            x: Math.random() * (OYUN.ALAN.GENISLIK - 100) + 50,
            y: Math.random() * (OYUN.ALAN.YUKSEKLIK - 100) + 50,
            mermiSayisi: 30
        });
    }
}

function silahAl() {
    if (window.innerWidth > 768) {
        silahlar.forEach((silah, index) => {
            const mesafe = Math.hypot(oyuncu.x - silah.x, oyuncu.y - silah.y);
            if (mesafe < 50) {
                oyuncu.silahVar = true;
                oyuncu.mermiSayisi += 30;
                silahlar.splice(index, 1);
                SES.oynat(SES.ates);
            }
        });
    }
}

function carpismalariKontrolEt() {
    for (let i = mermiler.length - 1; i >= 0; i--) {
        const mermi = mermiler[i];
        
        if (!mermi.dusmanMermisi) {
            for (let j = dusmanlar.length - 1; j >= 0; j--) {
                const dusman = dusmanlar[j];
                const mesafe = Math.hypot(mermi.x - dusman.x, mermi.y - dusman.y);
                
                if (mesafe < 30) {
                    dusman.can -= 25;
                    mermiler.splice(i, 1);
                    
                    if (dusman.can <= 0) {
                        dusmanlar.splice(j, 1);
                        SKOR.oldurulenDusman++;
                        SKOR.skorArttir(100);
                        npcOlustur();
                    }
                    break;
                }
            }
        } else {
            const mesafe = Math.hypot(mermi.x - oyuncu.x, mermi.y - oyuncu.y);
            if (mesafe < 30) {
                oyuncu.can -= 10;
                mermiler.splice(i, 1);
                if (oyuncu.can <= 0) {
                    oyunBitti();
                }
            }
        }
    }

    dusmanlar.forEach(dusman => {
        const mesafe = Math.hypot(oyuncu.x - dusman.x, oyuncu.y - dusman.y);
        if (mesafe < 40) {
            oyuncu.can -= 0.5;
            if (oyuncu.can <= 0) {
                oyunBitti();
            }
        }
    });
}

function kanEfektiOlustur(x, y, renk) {
    for (let i = 0; i < 8; i++) {
        const aci = (Math.PI * 2 / 8) * i;
        const hiz = 2 + Math.random() * 2;
        
        parcaciklar.push({
            x: x,
            y: y,
            hiz: hiz,
            aci: aci,
            yasam: 1,
            renk: renk
        });
    }
}

function parcaciklariGuncelle() {
    for (let i = parcaciklar.length - 1; i >= 0; i--) {
        const parcacik = parcaciklar[i];
        
        parcacik.x += Math.cos(parcacik.aci) * parcacik.hiz;
        parcacik.y += Math.sin(parcacik.aci) * parcacik.hiz;
        parcacik.yasam -= 0.02;
        
        if (parcacik.yasam <= 0) {
            parcaciklar.splice(i, 1);
        }
    }
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
    for(let i = 0; i < OYUN.DUSMAN.SAYI; i++) {
        npcOlustur();
    }

    silahlar = [];
    for(let i = 0; i < OYUN.SILAH.MAKS_SAYI; i++) {
        silahOlustur();
    }

    if (window.innerWidth > 768) {
        masaustuKontrolleriniEkle();
    } else {
        mobilKontrolleriniEkle();
    }

    SKOR.suankiSkor = 0;
    SKOR.oldurulenDusman = 0;

    if (animasyonID) {
        cancelAnimationFrame(animasyonID);
        animasyonID = null;
    }

    oyunDevamEdiyor = true;
    animasyonID = requestAnimationFrame(oyunDongusu);
}

function arayuzCiz() {
    const isMobil = window.innerWidth <= 768;
    const olcek = isMobil ? OYUN.MOBIL.ARAYUZ_OLCEK : 1;
    
    cizimAlani.save();
    cizimAlani.setTransform(1, 0, 0, 1, 0, 0);
    
    cizimAlani.fillStyle = 'rgba(0, 0, 0, 0.5)';
    cizimAlani.fillRect(10, 10, 200 * olcek, 130 * olcek);
    
    cizimAlani.fillStyle = '#ffffff';
    cizimAlani.font = `bold ${24 * olcek}px Arial`;
    cizimAlani.textAlign = 'left';
    cizimAlani.textBaseline = 'top';
    
    const yOffset = 20 * olcek;
    const satirAraligi = 30 * olcek;

    cizimAlani.fillText(`Can: ${Math.ceil(oyuncu.can)}`, 20, yOffset);
    
    cizimAlani.fillText(`Mermi: ${oyuncu.mermiSayisi}`, 20, yOffset + satirAraligi);
    
    cizimAlani.fillText(`Skor: ${SKOR.suankiSkor}`, 20, yOffset + satirAraligi * 2);
    
    cizimAlani.fillText(`Öldürülen: ${SKOR.oldurulenDusman}`, 20, yOffset + satirAraligi * 3);
    
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

function atesEt(hedefX, hedefY) {
    if (!oyuncu.silahVar || oyuncu.mermiSayisi <= 0) return;
    
    mermiOlustur(oyuncu.x, oyuncu.y, hedefX, hedefY);
    oyuncu.mermiSayisi--;
    SES.oynat(SES.ates);
    
    if (oyuncu.mermiSayisi <= 0) {
        oyuncu.silahVar = false;
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
    if (animasyonID) {
        cancelAnimationFrame(animasyonID);
        animasyonID = null;
    }

    tuval.removeEventListener('click', yenidenBaslat);
    tuval.removeEventListener('touchstart', yenidenBaslat);

    oyuncu.x = OYUN.ALAN.GENISLIK / 2;
    oyuncu.y = OYUN.ALAN.YUKSEKLIK / 2;
    oyuncu.can = 100;
    oyuncu.silahVar = false;
    oyuncu.mermiSayisi = 0;

    dusmanlar = [];
    for(let i = 0; i < OYUN.DUSMAN.SAYI; i++) {
        npcOlustur();
    }

    silahlar = [];
    for(let i = 0; i < OYUN.SILAH.MAKS_SAYI; i++) {
        silahOlustur();
    }

    mermiler = [];
    parcaciklar = [];

    oyunDevamEdiyor = true;
    animasyonID = requestAnimationFrame(oyunDongusu);
}

function dusmanYapayZekasi() {
    dusmanlar.forEach((dusman, index) => {
        const dx = oyuncu.x - dusman.x;
        const dy = oyuncu.y - dusman.y;
        const mesafe = Math.hypot(dx, dy);
        const aci = Math.atan2(dy, dx);
        
        let yeniX = dusman.x + Math.cos(aci) * dusman.hiz;
        let yeniY = dusman.y + Math.sin(aci) * dusman.hiz;

        let carpismaDurumu = false;
        dusmanlar.forEach((digerDusman, digerIndex) => {
            if (index !== digerIndex) {
                const dusmanMesafe = Math.hypot(
                    yeniX - digerDusman.x,
                    yeniY - digerDusman.y
                );
                
                if (dusmanMesafe < dusman.genislik * 3) {
                    carpismaDurumu = true;
                    const kacisAci = Math.atan2(dusman.y - digerDusman.y, dusman.x - digerDusman.x);
                    yeniX += Math.cos(kacisAci) * dusman.hiz;
                    yeniY += Math.sin(kacisAci) * dusman.hiz;
                }
            }
        });
        
        if (!carpismaDurumu) {
            if (mesafe < 300) {
                yeniX -= Math.cos(aci) * dusman.hiz * 0.5;
                yeniY -= Math.sin(aci) * dusman.hiz * 0.5;
            }
        }
        
        dusman.x = Math.max(dusman.genislik, Math.min(OYUN.ALAN.GENISLIK - dusman.genislik, yeniX));
        dusman.y = Math.max(dusman.yukseklik, Math.min(OYUN.ALAN.YUKSEKLIK - dusman.yukseklik, yeniY));
        
        dusman.yon = dx > 0 ? 1 : -1;
        
        const simdikiZaman = Date.now();
        if (simdikiZaman - dusman.sonAtesZamani > dusman.atesAraligi) {
            if (Math.random() < 0.7) {
                mermiOlustur(dusman.x, dusman.y, oyuncu.x, oyuncu.y, true);
                dusman.sonAtesZamani = simdikiZaman;
                
                dusman.atesAraligi = OYUN.DUSMAN.ATES_SURESI + Math.random() * 1000;
            }
        }
    });
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
        const atesX = enYakinDusman.x + (enYakinDusman.hiz * Math.cos(enYakinDusman.aci) * 10);
        const atesY = enYakinDusman.y + (enYakinDusman.hiz * Math.sin(enYakinDusman.aci) * 10);
        mermiOlustur(oyuncu.x, oyuncu.y, atesX, atesY);
        oyuncu.mermiSayisi--;
        
        const sesEfekti = new Audio('ses/ates.mp3');
        sesEfekti.volume = 0.5;
        sesEfekti.play().catch(err => console.log('Ses çalma hatası:', err));

        if (oyuncu.mermiSayisi <= 0) {
            oyuncu.silahVar = false;
            mobilKontroller.butonlar.ates.visible = false;
        }
    }
}

function reklamGoster() {
    const reklamPopup = document.getElementById('reklamPopup');
    const reklamGecBtn = document.getElementById('reklamGec');
    const sayac = document.querySelector('.sayac');
    const reklamAlan = document.querySelector('.reklam-alan');
    
    reklamAlan.innerHTML = '';
    
    const reklamTipi = Math.random() > 0.5 ? 'video' : 'gorsel';
    
    if (reklamTipi === 'video') {
        const video = document.createElement('video');
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';
        video.style.borderRadius = '10px';
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        
        const source = document.createElement('source');
        source.src = 'gorsel/reklam.mp4';
        source.type = 'video/mp4';
        
        video.appendChild(source);
        reklamAlan.appendChild(video);
        
        video.onended = () => {
            reklamPopup.style.display = 'none';
            yenidenBaslat();
        };
    } else {
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '10px';
        img.src = 'gorsel/reklam.jpg';
        
        reklamAlan.appendChild(img);
    }
    
    reklamPopup.style.display = 'flex';
    let kalanSure = 15;
    let gecSuresi = 5;
    
    const sayacInterval = setInterval(() => {
        kalanSure--;
        sayac.textContent = kalanSure;
        
        if (kalanSure <= 10) {
            gecSuresi--;
            reklamGecBtn.textContent = `Reklamı Geç (${gecSuresi})`;
            
            if (gecSuresi <= 0) {
                reklamGecBtn.disabled = false;
                reklamGecBtn.textContent = 'Reklamı Geç';
            }
        }
        
        if (kalanSure <= 0) {
            clearInterval(sayacInterval);
            reklamPopup.style.display = 'none';
            yenidenBaslat();
        }
    }, 1000);
    
    reklamGecBtn.addEventListener('click', () => {
        if (!reklamGecBtn.disabled) {
            clearInterval(sayacInterval);
            reklamPopup.style.display = 'none';
            yenidenBaslat();
        }
    });
}