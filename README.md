# discord-bot
A discord bot for a Crypto client

# Please note: 
Any commands that require a coin require a proper coin pair - the Symbol of the Coin and the Coin it's valued against.  For example, Lite Coin on the Bitcoin pairing will be LTCBTC.
    
Adding coins to the watch list will check the data of the coin every 5 seconds to see if there is any 10%-20% jumps in price.  If this happens twice during the duration of polling, the channel will be alerted.

# Working Commands

    * !crypto-price {COINPAIR}    //Returns current data from Binance
    * !big-gains           // Returns top coins (from CMC) with larger than 45% gains in 24hrs
    * !big-gains1h         // Returns top coins (from CMC) with larger than 25% gains in the last hour
    * !track {COINPAIR}    // Adds a coin to the watch list
    * !stop {COINPAIR}     // Removes a coin from the watch list
    * !tracking            // Returns a list of the coins being tracked.

