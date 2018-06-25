/**
 * Created by 17073565 on 2018/5/10.
 */
/**
 * 使用 node 实现简单的爬取基金信息
 * 用到的技术栈： express request cheerio mongodb
 * */
 const express = require('express')
 const events = require('events')
 const request = require('request')
 const iconv = require('iconv-lite')
 const cheerio = require('cheerio')
 const MongoClient = require('mongodb').MongoClient;
 const app = express();
 const Event = new events.EventEmitter();
 const dbUrl = 'mongodb://localhost:27017/';

 //爬虫
class FundSpider {
    constructor (dbName='func', collectionName='fundData', fragmentSize= '1000') {
        this.dbUrl = 'mongodb://localhost:27017';
        this.dbName = dbName;
        this.collectionName = collectionName;
        this.fragmentSize = fragmentSize
    }
    //获取url 对应的内容  除 utf8外 需要指定网页编码
    fetch(url, coding, callback) {
        request({url: url, encoding: null}, (error, response, body) => {
            let _body = coding === 'utf-8'? body: iconv.decode(body, coding);
            if (!error && response.statusCode === 200){
                callback(null, cheerio.load('<body>' + _body + '</body>'));
            }else {
                callback(error, cheerio.load('<body></body>'))
            }
        })
    }
    //爬取并解析基金的单位净值 增长率等信息
    fetchFundUrl(url, callback) {
        this.fetch(url, 'gb2312', (err,$)=>{
            let fundData = []
            if(!err) {
                let table = $('body').find("table")
                let tbody = table.find("tbody");
                try{
                    tbody.find("tr").each((i, trItem)=>{
                        let fundItem = {}
                        let tdArray = $(trItem).find("td").map((j, tdItem) => {
                            return $(tdItem)
                        });
                        fundItem.date = tdArray[0].text();
                        fundItem.unitNet = tdArray[1].text();
                        fundItem.accumulatedNet = tdArray[2].text();
                        fundItem.changePercent = tdArray[3].text();
                        fundData.push(fundItem)
                    })
                    callback(err, fundData)
                }catch(e) {
                    console.log(e);
                    callback(e, [])
                }
            }
        })
    }
    //根据基金代码获取其选定日期范围内的基金数据
    //基金代码 开始日期 截至日期 数据个数 回调函数
    fetchFundDate(code, sdate, edate, per=999, callback) {
        let fundUrl = 'http://fund.eastmoney.com/f10/F10DataApi.aspx?type=lsjz'
        let date = new Date();
        let dateNow = new Date();
        sdate = sdate? sdate : this.getDateStr(new Date(date.setFullYear(date.getFullYear() - 3)))
        edate = edate? edate : this.getDateStr(dateNow)
        fundUrl += ("&code=" + code + "&date=" +sdate + "&edate=" + edate + "&per=" + per)
        console.log(fundUrl);
        this.fetchFundUrl(fundUrl, callback)
    }

    //日期转字符串
    getDateStr(dd) {
        let y = dd.getFullYear();
        let m = (dd.getMonth() +1) < 10 ? "0" +(dd.getMonth() +1) : (dd.getMonth() + 1)
        let d = dd.getDate() < 10 ? "0" + dd.getDate() : dd.getDate();
        return y +"-"+ m + "-" + d
    }
    //批量获取所有基金
    fetchFundCodes(callback) {
        let url = '';
        this.fetch(url, 'gb2312', (err, $)=>{
            let fundCodesArray = []
            if(!err) {
                $("body").find('.num_right').find("li").each((i, item)=>{
                    let codeItem = $(item)
                    let codeAndName = $(codeItem.find("a")[0].text())
                    let codeAndNameArr = codeAndName.split(")")
                    let code = codeAndNameArr[0].substr(1);
                    let fundName = codeAndNameArr[1];
                    if(code) {
                        fundCodesArray.push(code)
                    }
                })
            }
            callback(err, fundCodesArray)
        })
    }
    //根据基金代码获取对应基本信息
    fetchFundInfo(code, callback) {
        let fundurl = '';
        let fundData = {fundCode: code}
        this.fetch(fundurl, 'utf-8', (err, $)=>{
            if(!err) {
                let dataRow = $("body").find(".detail .box").find("tr")
                fundData.fundName = $($(dataRow[0]).find("td")[0]).text();//基金全称
                fundData.fundNameShort = $($(dataRow[0]).find("td")[1]).text();//基金简称
                fundData.fundType = $($(dataRow[1]).find("td")[1]).text();//基金类型
                fundData.releaseDate = $($(dataRow[2]).find("td")[0]).text();//发行日期
                fundData.buildDate = $($(dataRow[2]).find("td")[1]).text();//成立日期/规模
                fundData.assetScale = $($(dataRow[3]).find("td")[0]).text();//资产规模
                fundData.shareScale = $($(dataRow[3]).find("td")[1]).text();//份额规模
                fundData.administrator = $($(dataRow[4]).find("td")[0]).text();//基金管理人
                fundData.custodian = $($(dataRow[4]).find("td")[1]).text();//基金托管人
                fundData.manager = $($(dataRow[5]).find("td")[0]).text();//基金经理人
                fundData.bonus = $($(dataRow[5]).find("td")[1]).text();//分红
                fundData.managementRate = $($(dataRow[6]).find("td")[0]).text();//管理费率
                fundData. trusteeshipRate = $($(dataRow[6]).find("td")[1]).text();//托管费率
                fundData.saleServiceRate = $($(dataRow[7]).find("td")[0]).text();//销售服务费率
                fundData.subscriptionRate = $($(dataRow[7]).find("td")[1]).text();//最高认购费率
            }
            callback(err, fundData)
        })
    }
    //并发获取的基金信息片段保存到数据库
    fundFragmentSave(collection, codesArray) {
        for(let i =0;i< codesArray.length; i++) {
            this.fetchFundInfo(codesArray[i], (err,fundData)=>{
                if(err){

                }else {
                    fundData["_id"] = fundData.fundCode;
                    collection.save(fundData, (err, res)=>{
                        Event.emit("",codesArray[i])
                    })
                }
            })
        }
    }
    //并发获取给定基金代码数组中对应的基金基本信息
    fundToSave(error, codesArray = []) {
        if(!error) {
            let oodeLength = codesArray.length;
            let itemNum = 0;
            let errorItems = [];
            let errorItemNum = 0;
            let correctItems = [];
            let correctItemNum = 0;
            MongoClient.connect(this.dbUrl, (err, db)=>{
                if(err) throw err;
                let fundDB = db.db(this.dbName)
                let dbCollection = fundDB.collection(this.collectionName);
                let concurrectCtrl = new ConcurrentCtrl(this, this.fragmentSize, this.fundFragmentSave, codesArray, dbCollection)
                Event.on("save_fundItem", (_code) => {
                    itemNum++;
                    console.log(`index: ${itemNum} --- code: ${_code}`);
                    concurrentCtrl.go(itemNum);
                    if (itemNum >= codesLength) {
                        console.log("save finished");
                        if(errorItems.length > 0){
                            console.log("---error code----");
                            console.log(errorItems);
                        }
                        db.close();
                    }
                });
                Event.on("error_fundItem", (_code) => {
                    errorItems.push(_code);
                    errorItemNum++;
                    console.log(`error index: ${errorItemNum} --- error code: ${_code}`);
                });
                Event.on("correct_fundItem", (_code) => {
                    correctItemNum++;
                });
                concurrentCtrl.go(0);
            })
        }else {

        }
    }
    //未传参数时则获取所有基金基本信息 ， 给定基金代码数组则获取对应信息，均更新到数据库
    fundSave(_codesArray){
        if(!_codesArray){
            this.fetchFundCodes((err, codesArray) => {
                this.fundToSave(err, codesArray);
            })
        }else{
            _codesArray = Object.prototype.toString.call(_codesArray)==='[object Array]'?_codesArray:[];
            if(_codesArray.length > 0){
                this.fundToSave(null, _codesArray);
            }else{
                console.log("not enough codes to fetch");
            }

        }
    }
}
 app.get('/',(req,res)=>{
     res.header("Access-Control-Allow-Origin", "*");
     res.send(`<h3>请访问以下形式的路径获取信息:</h3>
                <div>/fetchFundCodes</div>
                <div>/fetchFundInfo/:code</div>
                <div>/fetchFundData/:code/:page</div></br>
                <span>建议自建一套前端环境</span>
`)
 });
 app.get('/fetchFundCodes',(req,res)=>{
     let fundSpider = new FundSpider("fundFetch", "fundFetchData",1000);
     res.header()
     fundSpider.fetchFundCodes((err,data)=>{
         res.send(data.toString())
     })
 })
app.get('/fetchFundInfo/:code', (req, res)=>{
    let fundSpider = new FundSpider("fundFetch","fundFetchData",1000);
    res.header("Access-Control-Allow-Origin", "*");
    fundSpider.fetchFundInfo(req.params.code,(err, data)=>{
        res.send(JSON.stringify(data));
    });
});
app.get('/fetchFundData/:code/:per', (req, res)=>{
    let fundSpider = new FundSpider("fund2","fundData2",1000);
    res.header("Access-Control-Allow-Origin", "*");
    fundSpider.fetchFundData(req.params.code,undefined,undefined,req.params.per,(err, data)=>{
        res.send(JSON.stringify(data));
    });
});

app.listen(1234,()=>{
    console.log("service start on port 1234");
});

//控制单词并发调用的数量
class ConcurrentCtrl{
    //调用者上下文环境 并发分段数量 调用函数 总参数数组 数据库表名
    constructor (parent, splitNum, fn, dataArray = [], collection) {
        this.parent = parent;
        this.splitNum = splitNum;
        this.fn = fn;
        this.dataArray = dataArray;
        this.length = dataArray.length;
        this.itemNum = Math.ceil(this.length / splitNum);
        this.restNum = (this.length % splitNum) === 0 ? splitNum: (this.length % splitNum);
        this.collection = collection
    }

    //go(0) 启动调用，循环记数中达到分段数量便进行下一次扽段并发
    go(index) {
        if((index % this.splitNum) === 0) {
            if(index / this.splitNum !== (this.itemNum -1)) {
                this.fn.call((this.parent, this.collection, this.dataArray.slice(index, index + this.splitNum)))
            }else {
                this.fn.call(this.parent, this.collection, this.dataArray.slice(index,index + this.restNum))
            }
        }
    }
}
 let fundSpider = new FundSpider("fund","fundData",1000);
 fundSpider.fundSave();