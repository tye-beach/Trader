const apiController = require('./apiController');
const Moment = require('moment');


const binanceApi = "https://api.binance.com/api/v1/";
const marketCapApi = "https://api.coinmarketcap.com/v1/";

const coinList = {};

let debugMode = false;

const runCoinCompare = (coin, channel) => {
    if(coin.volume.length <= 1) return;
    let compareClose = 0,
        compareOpen = 0,
        compareVolume = 0;
    for(let i = 1; i < coin.volume.length; i++) {
        compareVolume += coin.volume[i] - coin.volume[i - 1];
        compareOpen += coin.open[i] - coin.open[i - 1];
        compareClose += coin.close[i] - coin.close[i - 1];
    }
    channel.send(`Compare Volume: ${ compareVolume }\nCompare Open: ${ compareOpen }\nCompare Close: ${compareClose}`);
}


const getPrice = (coinPair) => {
    return new Promise((resolve, reject) => {
        coinPair = coinPair.toUpperCase();
        apiController.callApi(`${binanceApi}ticker/24hr?symbol=${coinPair}`)
            .then(coin => {
                //console.log(coin);
                if(coin.code === -1121) return reject("Bad coin pairing");
                let msg = "```Here is the latest data on " + coinPair + " from Binance: \n" +
                "\nPrice Change%     : " + coin.priceChangePercent +
                "\nPrevious Close    : " + coin.prevClosePrice +
                "\nLast Price        : " + coin.lastPrice + 
                "\nBid Price         : " + coin.bidPrice +
                "\nAsk Price         : " + coin.askPrice +
                "\nOpen Price        : " + coin.openPrice +
                "\nHigh Price        : " + coin.highPrice +
                "\nLow Price         : " + coin.lowPrice +
                "\nVolume            : " + coin.volume  +
                "\nOpen Time         : " + Moment.unix(coin.openTime).format("hh:mm A") +
                "\nClose Time        : " + Moment.unix(coin.closeTime).format("hh:mm A") +
                "\nTrade Count       : " + coin.count + "```";
                resolve(msg);
            })
        .catch(err => { return reject(err)});
    })
}
const flagDebugMode = (channel) => {
    debugMode = !debugMode;
    if(channel) channel.send("Debugmode: " + debugMode)
}
const watchCoin = (coinPair, channel) => {
    if(channel == null) return false;
    channel.send("Watching " + coinPair);
    coinList[coinPair] = {
        timesRan: 0,
    }
    return new Promise((resolve, reject) => { 
        let newInterval = setInterval(() => {
            if(debugMode) channel.send("We're now tracking " + coinPair);
            apiController.callApi(`${binanceApi}klines?symbol=${ coinPair}&interval=1m`).then(data => {
                if(coinList[coinPair].open == null) coinList[coinPair].open = [];
                if(coinList[coinPair].close == null) coinList[coinPair].close = [];
                if(coinList[coinPair].volume == null) coinList[coinPair].volume = [];
                coinList[coinPair].lastVolumeGain = false;
                coinList[coinPair].lastOpenGain = false;
                coinList[coinPair].lastCloseGain = false;
                coinList[coinPair].open.push(data[0][1]);
                coinList[coinPair].close.push(data[0][4]);
                coinList[coinPair].volume.push(data[0][5]);
                if(debugMode) channel.send(`\n
                        Data for: ${coinPair}\n
                        Open: ${data[0][1]}\n
                        Close: ${data[0][4]}
                        Volume: ${data[0][5]}`.trim());
                runCoinCompare(coinList[coinPair], channel);
                
            })
            
        }, 15000);
        resolve(newInterval);
    });
}

const bigGains = (channel) => {
    apiController.callApi(`${ marketCapApi}ticker/?limit=1500`).then(data => {
        data = data.filter(coin => coin.percent_change_24h > 45);
        data.forEach((current) => { 
            channel.send(`
                ${ current.name }/${ current.symbol } gains: 
                1h: ${current.percent_change_1h }%
                24h: ${ current.percent_change_24h}%
            `.trim());
        })
    })
}

const bigGains1hr = (channel) => {
    apiController.callApi(`${ marketCapApi}/ticker/?limit=1500`).then(data => {
        data = data.filter(coin => coin.percent_change_1h > 25);
        data.forEach((current) => {
            channel.send(`
                ${ current.name }/${ current.symbol } gains: 
                1h: ${current.percent_change_1h }%
            `.trim())
        })
    });
}

const stopWatch = (timerId) => {
    clearInterval(timerId);
}

const showHelp = (channel) => {
    channel.send("```Aventus Crypto Bot Help\n\n" +
    "Please note: any commands that require a coin require a proper coin pair - the Symbol of the Coin and the Coin it's valued against.  For example, Lite Coin on the Bitcoin\n" +
    "pairing will be LTCBTC.\n\n" +
    "Working Commands\n" +
    "------------------------\n" +
    "!price COINPAIR    //Returns current data from Binance\n" +
    "!big-gains         // Returns top coins (from CMC) with larger than 45% gains in 24hrs\n"+
    "!big-gains1h       // Returns top coins (from CMC) with larger than 25% gains in the last hour\n```");
}

module.exports = { getPrice, watchCoin, stopWatch, flagDebugMode, bigGains, bigGains1hr, showHelp }