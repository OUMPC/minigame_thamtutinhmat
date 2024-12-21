if (!document.querySelector("#overplay-notification")) {
    document.body.innerHTML+=`<section id="overplay-notification" class="terminal"></section>`
}
document.INTERVAL = []

function createNotification(obj,timeOut) {
    let icon = {
        "right":`fa-circle-check`,
        "wrong":`fa-triangle-exclamation`,
        "warning":`fa-triangle-exclamation`
    }
    updateNotification(true)
    let d = document.querySelector("#overplay-notification")
    let className = initString()
    d.innerHTML += (`
    <div class="box ${obj.type} ${className}">
        <div class="status">
            <i class="fa-solid ${icon[obj.type]}"></i>
        </div>
        <div class="content">
            <p class="header"></p>
            <p class="detail"></p>
        </div>
    </div>
`)
    let part = 0
    let timer = 0
    let cur = true
    let titleArr = chunkString(obj.title,obj.title.length / (timeOut/1000 * 4))
    let detailArr = chunkString(obj.detail,obj.detail.length /(timeOut/1000 * 8))
    let title = ""
    let detail = ""
    
    document.INTERVAL[className] = setInterval(()=>{
        document.querySelector(`.${className}`).onclick  = ()=>{
            clearInterval(document.INTERVAL[className])
            document.querySelector(`.${className}`).remove()
            updateNotification()
        }
        let d = {
            title : document.querySelector(`.${className} .header`),
            detail : document.querySelector(`.${className} .detail`)
        }
        if (part == 0 && titleArr.length!=0) {
            title+=titleArr[0]
            titleArr.shift()            
            if (titleArr.length==0) {
                part++;
                d.title.innerText = title
            }else{
                d.title.innerText = title + "_"
            }
            return
        }
        if (part == 1 && detailArr.length!=0) {
            detail+=detailArr[0]
            detailArr.shift()
            d.detail.innerText = detail+ "_"
            if (detailArr.length==0) {
                part++;
                d.detail.innerText = detail
            }else{
                d.detail.innerText = detail + "_"
            }
            return
        }
        if (part == 2) {
            timer +=50
            if (timer % 500 == 0) {
                cur=!cur;
                if (cur) {
                    d.detail.innerText = detail+ "_"
                }else{
                    d.detail.innerText = detail
                }
            }
            if (timer > timeOut) {
                clearInterval(document.INTERVAL[className])
                document.querySelector(`.${className}`).remove()
                updateNotification()
            }
        }
    },50)
}

function updateNotification(bool) {
    

    let d = document.querySelector("#overplay-notification")
    if (bool) {
        d.style.display= "flex"
        return
    }    
    if (d.innerHTML.trim().length == 0) {
        d.style.display= "none"
    }
}

function initString() {
    let digits = Math.floor(Date.now()) % 100000000
    abc = "AzHdvWMlGF"
    let k = ""
    do{
        k+=abc[digits % 10]
        digits = Math.floor(digits / 10)
    }while (digits!=0)
    return k
}

function chunkString(str, chunkSize) {
    const result = [];
    for (let i = 0; i < str.length; i += chunkSize) {
      result.push(str.slice(i, i + chunkSize));
    }
    return result;
}
  