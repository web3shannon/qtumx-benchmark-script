/**
 * prepare enough UTXOs, then send them
 */
var readlineSync = require('readline-sync');
const { QtumRPC } = require('qtumjs')
const sleep = require('sleep');

/**
 * get change addresses for UTXO split
 */
async function getAddressList(rpc, splitNum) {
    let addrList = []

    for (let i = 0; i != splitNum; i++) {
        let changeAddr = await rpc.rawCall('getrawchangeaddress')
        addrList.push(changeAddr)
    }

    return addrList
}

async function createTransaction(rpc, utxo, gas, isSplit, splitNum, addrList) {
    let left = Math.floor(utxo.amount - gas, 2)
    let change = 0
    if (isSplit) {
        change = Math.floor(left / splitNum, 2)
        left = left - change * (splitNum - 1)
    }

    let data = [
        [{ 'txid': utxo.txid, 'vout': utxo.vout }],
        { [addrList[0]]: left }
    ]
    if (isSplit) {
        for (let i = 1; i != splitNum; i++) {
            let changeAddr = addrList[i]
            data[1][changeAddr] = change
        }
    }

    // console.log(data)
    return await rpc.rawCall('createrawtransaction', data)
}

async function getUtxoList(rpc) {
    let utxoList = await rpc.rawCall('listunspent')
    utxoList = utxoList.filter(function (utxo) {  // make sure UTXO has enough money
        return utxo.amount > 10
    })
    console.log('valid UTXO number: ' + utxoList.length)

    return utxoList
}

/**
 * wait all txs in mempool to be packed into block
 */
async function waitMempool(rpc) {

    while (true) {
        sleep.sleep(1)
        let mempoolInfo = await rpc.rawCall('getmempoolinfo')
        console.log('transaction number left in mempool: ' + mempoolInfo.size)
        if (mempoolInfo.size == 0) {
            break
        }
    }
}

/**
 * prepare UTXOs
 */
async function prepare(rpc, num, splitNum, gas, addrList) {
    console.log('start prepare')

    while (true) {
        let utxoList = await getUtxoList(rpc)
        if (utxoList.length >= num) {  // enough UTXOs, finish prepare
            break
        }

        // split every UTXO into splitNum UTXOs
        let utxoNum = utxoList.length
        for (let i = 0; i != utxoList.length; i++) {
            let rawTransaction = await createTransaction(rpc, utxoList[i], gas, true, splitNum, addrList)
            rawTransaction = await rpc.rawCall('signrawtransaction', [rawTransaction])
            rpc.rawCall('sendrawtransaction', [rawTransaction.hex])

            utxoNum = utxoNum + (splitNum - 1)
            if (utxoNum >= num) {
                break
            }
        }
        console.log('generated UTXO number: ' + (utxoNum - utxoList.length))

        await waitMempool(rpc)
    }

    console.log('finish prepare')
}

/**
 * prepare UTXOs
 */
async function send(rpc, num, gas, addrList) {
    console.log('start benchmark')

    while (true) {
        let utxoList = await getUtxoList(rpc)
        if (utxoList.length < num) {  // not enough UTXOs
            console.log('not enough UTXOs')
            break
        }

        // prepare signed txs
        let rawTransactionList = []
        for (let i = 0; i != utxoList.length; i++) {
            let rawTransaction = await createTransaction(rpc, utxoList[i], gas, false, 0, addrList)
            rawTransaction = await rpc.rawCall('signrawtransaction', [rawTransaction])
            rawTransactionList.push(rawTransaction.hex)
        }
        console.log('prepared transaction number: ' + rawTransactionList.length)
        readlineSync.question('Send? ');

        // send txs
        let callList = []
        for (let i = 0; i != rawTransactionList.length; i++) {
            callList.push(rpc.rawCall('sendrawtransaction', [rawTransactionList[i], false, false]))  // use a modified sendrawtransaction API

            if (callList.length == 50) {  // threads of rpc
                await Promise.all(callList)
                callList = []
            }
        }

        await waitMempool(rpc)
    }

    console.log('finish benchmark')
}

/**
 * rpcurl
 * number of UTXO to prepare
 * how many UTXOs to split one UTXO into
 * gas per transaction
 */
async function run(url, num, splitNum, gas) {
    const rpc = new QtumRPC(url)

    let addrList = await getAddressList(rpc, splitNum)
    await prepare(rpc, num, splitNum, gas, addrList)
    await send(rpc, num, gas, addrList)
}

run('http://test:test@127.0.0.1:12581', 8096, 2, 0.1).then()