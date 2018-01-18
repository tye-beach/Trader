const apiController = require('./apiController');
const Moment = require('moment');


const binanceApi = "https://api.binance.com/api/v1/";
const marketCapApi = "https://api.coinmarketcap.com/v1/";

const coinList = {};

let debugMode = false;

const runCoinCompare = (coinPair, coin, channel) => {
    if(coin.high.length <= 1) return;
    if(coin.high.length >= 30) {
        coin.high = [];
        coin.low = [];
        return;
    }
    let timesHigh = 0,
        timesLow = 0;
    
    for(let i = 1; i < coin.high.length; i++) {
        if(coin.high[i] > (coin.high[i-1] * 1.10) && coin.high[i] < (coin.high[i-1] * 1.20)) timesHigh++;
        if(coin.low[i] > coin.low[i-1]) timesLow++;
    }

    if(timesHigh >= 2 && timesLow > 1)
        channel.send("```" + coinPair + " has had some significant gains in the past " + (coin.high.length * 5) / 1000 + " seconds.```");
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
    if(coinPair.trim().length < 6) return channel("```Not a valid coin pair```");
    channel.send("```I'm now tracking " + coinPair + "```");
    coinList[coinPair].interval = {};
    coinList[coinPair].interval = setInterval(() => {
        apiController.callApi(`${binanceApi}klines?symbol=${ coinPair}&interval=1m`).then(data => {
            //if(data.code === -1121) return channel.send("Invalid coin pair");
            if(!data) {
                clearInterval(newInterval);
                return channel.send("Not a valid coin pair");
            }
            
            if(coinList[coinPair].high == null) coinList[coinPair].high = [];
            if(coinList[coinPair].low == null) coinList[coinPair].low = [];
            coinList[coinPair].high.push(data[0][2]);
            coinList[coinPair].low.push(data[0][3]);
            runCoinCompare(coinPair, coinList[coinPair], channel);        
            return;        
        })
        .catch(err => {
            clearInterval(newInterval);
            return channel.send("That is not a valid coinpair");
        })
        
    }, 5000);
}

const trackedCoins = (channel) => {
    if(Object.keys(coinList).length === 0) return channel.send("Sorry, I'm not tracking any coins.");
    var coins = [];
    for(var i in coinList) {
        coins.push(i);
    }
    
    coins.forEach((current) => {
        channel.send("```Tracking: " + current + "```");
    })
}

const bigGains = (channel) => {
    apiController.callApi(`${ marketCapApi}ticker/?limit=500`).then(data => {
        data = data.filter(coin => coin.percent_change_24h > 45);
        data.forEach((current) => { 
            channel.send("```" +
                current.name + " / " + current.symbol + " gains:" + 
                "\n1h   : " + current.percent_change_1h + "%" +
                "\n24h  : " + current.percent_change_24h +"%```"
            );
        })
    })
}

const bigGains1hr = (channel) => {
    apiController.callApi(`${ marketCapApi}/ticker/?limit=500`).then(data => {
        data = data.filter(coin => coin.percent_change_1h > 25);
        data.forEach((current) => {
            channel.send("```"+
                current.name + "/" + current.symbol + " gains:" + 
                "\n1h   : " + current.percent_change_1h + "%```"
            );
        })
    });
}

const stopWatch = (coinPair) => {
    clearInterval(coinList[coinPair].interval);
    delete coinList[coinPair];
}

const showHelp = (channel) => {
    channel.send("```Aventus Crypto Bot Help\n\n" +
    "Please note: any commands that require a coin require a proper coin pair - the Symbol of the Coin and the Coin it's valued against.  For example, Lite Coin on the Bitcoin " +
    "pairing will be LTCBTC.\n\n" +
    "Adding coins to the watch list will check the data of the coin every 5 seconds to see if there is any 10%-20% jumps in price.  If this happens twice during the " +
    "duration of polling, the channel will be alerted.\n\n" +
    "Working Commands\n" +
    "----------------------------------------------------------------\n" +
    "!crypto-price {COINPAIR}    //Returns current data from Binance\n" +
    "!big-gains           // Returns top coins (from CMC) with larger than 45% gains in 24hrs\n"+
    "!big-gains1h         // Returns top coins (from CMC) with larger than 25% gains in the last hour\n" + 
    "!track {COINPAIR}    // Adds a coin to the watch list\n" + 
    "!stop {COINPAIR}     // Removes a coin from the watch list\n" + 
    "!tracking            // Returns a list of the coins being tracked.\n```");
}

module.exports = { getPrice, watchCoin, stopWatch, flagDebugMode, bigGains, bigGains1hr, showHelp, trackedCoins }