const express = require('express');
const app = express();
const server = require('http').createServer(app);
const request = require('request');
const cheerio = require('cheerio');

const base_url = "https://chiasenhac.vn";
const base_url_query = base_url + "/tim-kiem?q=";
const number_result = "&page_music=";//10 kết quả 1 trang
const no_image = base_url + "/imgs/no_cover.jpg";

app.get('/', function(req, res){
    res.end(`
        <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body>
                <h1>
                    Server này được xây dựng cho trang chiasenhac.vn
                </h1></br>

                <h1>
                    get data với url: /search/tên bài hát hoặc tên ca sĩ hoặc cả 2 để tìm kiếm
                </h1></br>
                <h3>
                    ví dụ: /search/hãy trao cho anh
                </h3></br>

                <h1>
                    get link mp3 with: /mp3?link_mp3=link tới trang mp3
                </h1></br>
                <h3>
                    ví dụ: /mp3?link_mp3=https://haha.music.com/hay-trao-cho-anh.html
                </h3></br>

                <h1>
                    get bxh with: /bxh?topic=quoc gia (hiện hỗ trợ: viet nam, trung quoc, han quoc, nhat ban, au my, khac)
                </h1></br>
                <h3>
                    ví dụ: /bxh?topic=việt nam
                </h3></br>
                <h3>
                    hoặc: /bxh?topic=viet nam
                </h3>
            </body>
        </html>
    `);
});

app.get('/search/:key', async function(req, res){
    const key = formatKeySearch(req.params.key);
    const url = base_url_query + key;
    console.log(url);
    let list_result = [];

    try{
        //lấy 20 kết quả trả về trong 1 lần search
        //cho serach next page tính sau haha
        //pull to request -> android
        const result1 = await getListSongResultFromUrl(url + number_result + "1");
        const result2 = await getListSongResultFromUrl(url + number_result + "2");

        list_result = list_result.concat(result1);
        list_result = list_result.concat(result2);

        res.json(list_result);
    }catch(err){}
});

app.get('/mp3', async function(req, res){
    const link = req.query.link_mp3;
    try{
        let mp3 = await getMp3FromLinkPage(link);
        res.json({mp3: mp3});
    }catch(err){}
});

app.get('/bxh', async function(req, res){
    const req_topic = changeVietnameseToEnglish(req.query.topic);
    console.log(req_topic);
    let topic = "";

    switch(req_topic.toLowerCase()){
        case "viet nam":
            topic = "#cat-3-music";
            break;
        case "au my":
            topic = "#cat-4-music"
            break;
        case "trung quoc":
            topic = "#cat-5-music";
            break;
        case "han quoc":
            topic = "#cat-6-music";
            break;
        case "nhat ban":
            topic = "#cat-7-music";
            break;
        case "khac":
            topic = "#cat-9-music"
            break;
    }

    try{
        list_result = await getHotSongFromTopic(topic);
        res.json(list_result);
    }catch(err){}

});

getHotSongFromTopic = async function(topic){
    let list_song = [];
    try{
        const body = await getHtmlFromUrl(base_url + "/nhac-hot");
        const $ = cheerio.load(body);

        $(`${topic} > ul.list_music.bxh1 > li`).each((i, element)=>{
            let info = $(element).find('div.media-left > a');
            let link_mp3 = base_url + info.attr('href');
            let name = info.attr('title');
            let img = info.find('img').attr('src');
            let singer = $(element).find('.author').text();

            if(img === no_image){
                img = "no_image";
            }

            let song = {
                name: name,
                image: img,
                singer: singer,
                page_mp3: link_mp3
            }

            list_song.push(song);
        });

        return list_song;

    }catch(err){}
}

getHtmlFromUrl = function(url){
    return new Promise((success, failed)=>{
        request({uri: url}, function (error, response, body) {
            if(error){
                failed("haha loi roi");
            }else{
                success(body);
            }
        });
    });
}

getListSongResultFromUrl = async function(url){
    let list_result = [];
    try{
        const body = await getHtmlFromUrl(url);
        const $ = cheerio.load(body);

        $('#nav-music > ul.music_kq > li').each((i, element)=>{
            let info = $(element).find('.search-line-music');
            let link_mp3 = info.attr('href');
            let name = info.attr('title');
            let img = info.find('img').attr('src');
            let singer = $(element).find('.author').text();

            if(img === no_image){
                img = "no_image";
            }

            let song = {
                name: name,
                image: img,
                singer: singer,
                page_mp3: link_mp3
            }

            list_result.push(song);
        });

        return list_result; 
    }catch(err){}
}

getMp3FromLinkPage = async function(link){
    try{
        const body = await getHtmlFromUrl(link);
        const $ = cheerio.load(body);
        
        const mp3 = $('a.download_item > span.c1').parent().attr('href');
        return mp3;

    }catch(err){}
}

formatKeySearch = function(key){
    return changeVietnameseToEnglish(key.trim()).replace(/\s+/g, "%20");
}

changeVietnameseToEnglish = function(alias){
    var str = alias;
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g," ");
    str = str.replace(/ + /g," ");
    str = str.trim(); 
    return str;
}

const port = process.env.PORT || 1502;
server.listen(port, ()=>{
    console.log(`Server listening on port: ${port}`);
})