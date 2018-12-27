/**
 * list recent blocks, including height, time, hash, tx number
 */
const { QtumRPC } = require('qtumjs')

async function run(url, num) {
    const rpc = new QtumRPC(url)
    let blockhash = await rpc.rawCall('getbestblockhash')

    for (let i = 0; i != num; i++) {
        blockData = await rpc.rawCall('getblock', [blockhash])

        console.log(blockData.height, blockData.time, blockhash, blockData.tx.length)
        blockhash = blockData.previousblockhash
    }
}

// rpcurl, number of recent blocks to list
run('http://test:test@127.0.0.1:12580', 20).then()