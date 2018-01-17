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
                if(coin.code === -1121) return reject("Bad coin pairing");
                let msg = `Here is the latest data on ${coinPair} from Binance:
                Price Change%: ${coin.priceChangePercent}%
                Previous Close: ${ coin.prevClosePrice }
                Last Price: ${ coin.lastPrice }
                Bid Price: ${ coin.bidPrice }
                Ask Price: ${ coin.askPrice }
                Open Price: ${ coin.openPrice }
                High Price: ${coin.highPrice }
                Low Price: ${coin.lowPrice}
                Volumn: ${ coin.volume }
                Open Time: ${ Moment.unix(coin.openTime).format("hh:mm A") }
                Close Time: ${ Moment.unix(coin.closeTime).format("hh:mm A") }
                Trade Count: ${ coin.count }
                `.trim();
                return resolve(msg);
            })
            .catch((err) => {return reject(err) });

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


module.exports = { getPrice, watchCoin, stopWatch, flagDebugMode, bigGains, bigGains1hr }