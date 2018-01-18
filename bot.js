const Discord = require('discord.js');
const request = require('request');
const Twitter = require('twitter');
const Express = require('express');
const Bot = require('./controllers/botController');
const discordClient = new Discord.Client();

const binanceApi = "https://api.binance.com/";
const marketCapApi = "https://api.coinmarketcap.com/v1/";
const app = Express();


var coinPairs = {};

const countTrackedCoins =  


discordClient.on('ready', () => {
    //discordClient.guilds.forEach((current) => { console.log(current)})
    
});

discordClient.on("message", (message) => {
    let chnl = message.channel;
    var coinKey = "";
    let msg = message.content.toLowerCase().split(' ');
    
    switch(msg[0]) {
        case "!crypto-price":
            if(msg.length == 1) return chnl.send("Please include a valid coin pair e.g. LTCBTC");
            Bot.getPrice(msg[1])
                .then((msg) => { return chnl.send(msg) })
                .catch(() => {return chnl.send("Invalid coin pair.  Please format (for example): XRPETH.")});
            break;
        case "!track":
            if(msg.length == 1) return chnl.send("Please include a valid coin pair e.g. LTCBTC");
            coinKey = msg[1].toUpperCase();
            if(!(coinKey in coinPairs)) {
                coinPairs[coinKey] = {};
                Bot.watchCoin(coinKey, chnl);
            } else {
                chnl.send(coinKey + ' is already being watched');
            }
            break;
        case "!stop":
            if(msg.length == 1) return chnl.send("Please include a valid coin pair e.g. LTCBTC");
            coinKey = msg[1].toUpperCase().trim();
            if(!(coinKey in coinPairs))
                chnl.send("Nothing to stop!");
            else 
                Bot.stopWatch(coinPairs[coinKey]);
           
            break;
        case "!big-gains":
            chnl.send("Searching for big gains (>45%) :rocket: in the past 24hrs according to CoinMarketCap");
            Bot.bigGains(chnl);
            break;
        case "!big-gains1h":
            chnl.send("Searching for big gains (>25%) :rocket: in the past hour according to CoinMarketCap");
            Bot.bigGains1hr(chnl);
            break;
        case "!bot-help":
            Bot.showHelp(chnl);
            break;
        case "!tracking":
            Bot.trackedCoins(chnl);
            break;
        case "!debug":
            Bot.flagDebugMode(chnl);
            break;
        default:
    }
})



discordClient.login(process.env.DISCORDAUTH || require('./auth/discordAuth').secret);

app.listen(process.env.PORT || 3000);