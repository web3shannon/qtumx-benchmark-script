/**
 * list recent blocks, including height, time, hash, tx number
 */
const { QtumRPC } = require('qtumjs')

async function run(url, num) {
    const rpc = new QtumRPC(url)
    let blockhash = await rpc.rawCall('getbestblockhash')

    console.log('# block_height\tblock_time\tblock_hash\tblock_miner\tblock_tx_count')
    for (let i = 0; i != num; i++) {
        blockData = await rpc.rawCall('getblock', [blockhash])

        console.log(`${blockData.height}\t${blockData.time}\t${blockhash}\t${blockData.miner}\t${blockData.tx.length}`)
        blockhash = blockData.previousblockhash
    }
}

// rpcurl, number of recent blocks to list
run('http://test:test@127.0.0.1:12580', 20).then()