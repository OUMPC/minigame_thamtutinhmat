const config = {
    'first_interaction': false,
    'music': true
}

class Sound extends Audio {
    constructor(src) {
        super(src);
    }

    play(vol=null) {
        this.currentTime = 0;
        if (vol) {
            this.volume = vol;
        }
        super.play();
    }

    playInf(vol=null, time_back=0) {
        this.loop = true;
        if (vol) {
            this.volume = vol;
        }
        this.onended = () => {
            this.currentTime = time_back;
            this.play();
        }
        this.play();
    }
    
    continuePlay() {
        super.play();
    }
}

function initNamePlayer() {
    const name = localStorage.getItem("player-name");
    if (name && name.trim() != "") {
        $("#player-name").val(name);
    }else{
        const a = ["Con gà con", "Chim cánh cụt", "Chó đóm con", "Mèo xù lông", "Heo hồng ụt ịt", "Cá vàng bơi", "Cá sấu lười", "Chuột nhắt", "Chim sẻ đi nắng", "Chim én bay"]
        // ID 8 chữ số
        const id = Date.now().toString().slice(-8);
        const name = a[Math.floor(Math.random() * a.length)] + " - " + id;
        $("#player-name").attr("placeholder",   name);
        localStorage.setItem("player-name", name);
    }
}

$("#player-name").change(function() {
    localStorage.setItem("player-name", $("#player-name").val());
    if ($("#player-name").val().length == 0) {
        initNamePlayer()
        return;
    }
})

initNamePlayer()

const sfx = {
    'background': new Sound('/audio/menu.m4a'),
    'game': new Sound('/audio/game.mp3'),
    'win': new Sound('/audio/win.mp3'),
    'lose': new Sound('/audio/lose.m4a'),
    'click': new Sound('/audio/click.mp3'),
    'correct': new Sound('/audio/correct.mp3'),
    'cd': new Sound('/audio/cd.mp3'),
    'wrong': new Sound('/audio/wrong.mp3'),
    'warn': new Sound('/audio/warn.mp3'),
}

function setVolume() {
    sfx['background'].volume = 0.5;
    sfx['game'].volume = 0.5;
    sfx['win'].volume = 0.7;
    sfx['lose'].volume = 0.5;
    sfx['click'].volume = 0.5;
    sfx['correct'].volume = 0.7;
    sfx['cd'].volume = 0.5;
    sfx['wrong'].volume = 0.6;
    sfx['warn'].volume = 0.6;
}

function initEvents() {
    $(".btn").click(function() {
        sfx['click'].play();
    })
    $("button").click(function() {
        sfx['click'].play();
    })
}

initEvents()
setVolume()

$("#music-btn").click(function() {
    if (config.music) {
        config.music = false;
        for (let key in sfx) {
            sfx[key].volume = 0;
        }
        $("#music-btn i").removeClass("bi-volume-up").addClass("bi-volume-mute");
    } else {
        config.music = true;
        setVolume()
        $("#music-btn i").removeClass("bi-volume-mute").addClass("bi-volume-up");
    }
})

$('body').click(function() {
    if (!config.first_interaction) {
        config.first_interaction = true;
        sfx['background'].playInf();
    }
})



$("#full-screen").click(function() {
    
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        $(this).addClass("exit-full-screen");
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            $(this).removeClass("exit-full-screen");
        }
    }
})

$("#start").click(function() {
    clearDraw() 
    // if ($("#player-name").val() == "") {
    //     alert("Nhâp tên của bạn cái bạn ơi");
    //     return;
    // }
    // localStorage.setItem("player-name", $("#player-name").val());
    $("#back-home").show();
    $("#bg_mascot").hide();
    $("#info").hide();
    toSelectLevel();
})

$("#leaderboard-btn").click(function() {
    $("#leaderboard-btn").hide();
    $("#main-menu").hide();
    $("#back-home").show();
    $("#leaderboard").show();
    $("#level-menu").hide();
    $("#bg_mascot").hide();
    $.ajax({
        url: '/leaderboard',
        method: 'GET',
        success: function(data) {
            $("#leaderboard-list").empty();
            if (data.length == 0) {
                $("#leaderboard-list").append(`<tr><td colspan="4">No data</td></tr>`);
                return;
            }
            data.forEach((item, index) => {
                $("#leaderboard-list").append(`<tr><td>${index+1}</td><td>${item.name}${
                    item.name == localStorage.getItem("player-name")? " (Bạn)" : ""
                }</td><td>${item.level}</td><td>${item.score}</td></tr>`)
            });
            // $("#leaderboard").show();
        },
        error: function(error) {
            console.error("Error fetching leaderboard:", error);
        }
    });
})



$("#back-home").click(function() {
    toMainMenu();
})

function toMainMenu() {
    $("#info").show();
    $("#main-menu").show();
    $("#level-menu").hide();
    $("#game-screen").hide();
    $("#leaderboard").hide();
    $("#leaderboard-btn").show();
    $("#bg_mascot").show();
    sfx['game'].pause();
    sfx['game'].currentTime = 0;
    sfx['background'].playInf();
}

$("#info").click(function() {
    $("#info-description").css("display", "flex");
})

$("#close_info").click(function() {
    $("#info-description").hide();
})

function toSelectLevel() {
    $("#back-home").show();
    sfx['background'].continuePlay()
    clearDraw() 
    $("#main-menu").hide();
    $("#game-screen").hide();
    $("#level-menu").show();
    $.ajax({
        url: '/levels',
        method: 'GET',
        success: function(data) {
            $("#levels").empty();
            $("#levels").append(`<button id="level-random" class="info"><i class="bi bi-shuffle"></i></button>`)
            data.forEach((level, index) => {
                $("#levels").append(`<button id="${level.name}" class="info level-item" level="${index}">${index+1}</button>`)
            });

            $("#level-random").click(function() {
                const lv = Math.floor(Math.random() * data.length);
                toGame(data[lv]);
            })

            $(".level-item").click(function() {
                const level = data[$(this).attr("level")];
                toGame(level);
            })

            initEvents()
        },
        error: function(error) {
            console.error("Error fetching levels:", error);
        }
    });
}

function toGame(level) {
    let warn_time = false

    sfx['background'].pause();
    sfx['background'].currentTime = 0;
    

    const data = {
        'cur':0,
        'max':level["points"].length,
        'sub': level.time * 1000 / 15,
        'p': []
    }
    $("#cur-score").text(data.cur);
    level["points"].forEach(point => {
        data.p.push({
            'x': point.x,
            'y': point.y,
            'r': point.r,
            'checked': false
        })
    })
    
    $("#level-menu").hide();
    $("#main-menu").hide();
    $("#back-home").hide();
    $("#leaderboard-btn").hide();
    runOverplay()
    $("#pic1 img").attr("src", level.img_1);
    $("#pic2 img").attr("src", level.img_2);
    // Canva
    

    setTimeout(() => {
        sfx['game'].playInf();
        $("#game-screen").show();
        $("#pic1 img").attr("src", level.img_1);
        $("#pic2 img").attr("src", level.img_2);
        
        const canvas1 = document.getElementById('cv_pic1');
        const canvas2 = document.getElementById('cv_pic2');
        canvas1.width = $('#pic1').width();
        canvas1.height = $('#pic1').height();
        canvas2.width = $('#pic2').width();
        canvas2.height = $('#pic2').height();

        const duration = 1000*level.time;
        let currentTime = duration;
        let loop = setInterval(() => {
            changeColor(currentTime, duration);
            $("#cur-time").text(`${currentTime >= 0 ? Math.round(currentTime/1000) : 0}s`);
            if (currentTime <= duration/3 && !warn_time) {
                warn_time = true;
                sfx['warn'].play();
                $("#line-time").effect("shake", { times: 2 }, 150);
            }

            if (currentTime <= 0) {
                clearEvents() 
                $("#game-screen").hide();
                clearInterval(loop);
                sfx['game'].pause();
                sfx['game'].currentTime = 0;
                sfx['lose'].play();
                $("#lose").css("display", "flex");
                
                $("#lose").click(function() {
                    toSelectLevel()
                    $("#lose").hide();
                    sfx['lose'].pause();
                })
                return;
            }

            if (data.cur >= data.max) {
                clearInterval(loop);
                clearEvents() 
                sfx['game'].pause();
                sfx['game'].currentTime = 0;
                sfx['win'].play();
                $("#win").css("display", "flex");
            
                setTimeout(() => {
                    $("#game-screen").hide();
                    $("#win").hide();
                }, 4500);
                saveScore(currentTime, level.name)
                setTimeout(() => {
                    toSelectLevel()
                }, 3000);

                return;
            }
            $("#line-time div").css("height", `${(currentTime >=0 ? currentTime : 0)/duration*100}%`);
            currentTime -= 100;
        }, 100);

        $('#cv_pic1').click(function(event) {
            x_pct = event.offsetX / $('#pic1 img').width();
            y_pct = event.offsetY / $('#pic1 img').height();
            result = checkAnswer(data, x_pct, y_pct);
            $("#cur-score").text(data.cur);
            currentTime = currentTime - result;
        });

        $('#cv_pic2').click(function(event) {
            x_pct = event.offsetX / $('#pic2 img').width();
            y_pct = event.offsetY / $('#pic2 img').height();
            result = checkAnswer(data, x_pct, y_pct);
            $("#cur-score").text(data.cur);
            currentTime = currentTime - result;
        });
    }, 4000);
}

function clearEvents() {
    $('#cv_pic1').off('click');
    $('#cv_pic2').off('click');
}

function saveScore(score, level) {
    const name = localStorage.getItem("player-name");
    fetch('/leaderboard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            score: score,
            level: level
        })
    })
    .then(response => response.json())
    .then(() => {
        createNotification({
            title: "Đã lưu điểm số",
            detail: `Điểm số của bạn đã được lưu lại`,
            type: "right"
        },3000)
    })
    .catch(error => {
        console.error("Error saving score:", error);
    });
}

function changeColor(currentTime, duration) {
    // Màu thanh thời gian từ Xanh đậm -> Cam -> Đỏ
    const percentage = currentTime / duration;
    let r, g, b;

    if (percentage > 0.5) {
        r = 255 * (1 - 2 * (percentage - 0.5));
        g = 255;
        b = 0;
    } else {
        r = 255;
        g = 255 * (2 * percentage);
        b = 0;
    }
    $("#line-time div").css("background-color", `rgb(${r}, ${g}, ${b})`);
}

function checkAnswer(data, x_pct, y_pct) {
    console.log(`
        "x": ${x_pct},
        "y": ${y_pct},
        `);   
    let sub = data.sub;
    points = data.p
    for (let point of points) {
        if (point.checked) continue;
        if (Math.sqrt((x_pct - point.x)**2 + (y_pct - point.y)**2) < point.r) {
            // console.log("Found point", point);
            point.checked = true;
            data.cur += 1;
            drawRightPoint(point.x, point.y);
            sfx['correct'].play();
            return 0;
        }
    }
    sfx['wrong'].play();
    $("#game")
    .effect("shake", { times: 2 }, 150);
    return sub;
}

function drawRightPoint(x_pct, y_pct) {
    const canvas1 = document.getElementById('cv_pic1');
    const ctx1 = canvas1.getContext('2d');

    ctx1.strokeStyle = 'black';
    ctx1.lineWidth = 4;
    ctx1.beginPath();
    const radius = canvas1.width * 0.05;
    const x = x_pct * canvas1.width;
    const y = y_pct * canvas1.height;
    ctx1.arc(x, y, radius, 0, 2 * Math.PI);
    ctx1.stroke();

    ctx1.strokeStyle = 'white';
    ctx1.lineWidth = 2;
    ctx1.beginPath();
    ctx1.arc(x, y, radius, 0, 2 * Math.PI);
    ctx1.stroke();

    const canvas2 = document.getElementById('cv_pic2');
    const ctx2 = canvas2.getContext('2d');

    ctx2.strokeStyle = 'black';
    ctx2.lineWidth = 4;
    ctx2.beginPath();
    ctx2.arc(x, y, radius, 0, 2 * Math.PI);
    ctx2.stroke();

    ctx2.strokeStyle = 'white';
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.arc(x, y, radius, 0, 2 * Math.PI);
    ctx2.stroke();
}

function clearDraw() {
    const canvas1 = document.getElementById('cv_pic1');
    const ctx1 = canvas1.getContext('2d');
    ctx1.clearRect(0, 0, canvas1.width, canvas1.height);

    const canvas2 = document.getElementById('cv_pic2');
    const ctx2 = canvas2.getContext('2d');
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
}

function runOverplay() {
    sfx['cd'].play();
    $("#overplay").css("display", "flex");
    const cap = ["GO!", "1", "2", "3"];
    $("#overplay").text(cap.pop());
    let interval = setInterval(() => {
        if (cap.length == 0) {
            clearInterval(interval);
            $("#overplay").hide();
        } else {
            $("#overplay").text(cap.pop());
        }
    }, 1000);
}

function checkScreenSize(){
    var w = window.innerWidth;
    var h = window.innerHeight;
    if(w*2/3 < h) {
        $("#block").css("display", "flex");
    }else{
        $("#block").css("display", "none");
    }    
}
checkScreenSize()
window.addEventListener('resize', checkScreenSize);


