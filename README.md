# qtum-benchmark
Tools for benchmarking Qtum node

# How it works
![image](doc/img/1.png)
There are 2 stages:
1. Prepare. Generate enough UTXOs for benchmarking.
2. Send. Send prepared UTXOs to the node.

# How to use
```
// Download the code and install dependencies
$ git clone https://github.com/zsrem/qtum-benchmark.git
$ cd qtum-benchmark
$ npm install

/**
 * Configuration in bench.js
 * rpcurl
 * number of UTXO to prepare
 * how many UTXOs to split one UTXO into
 * gas per transaction
 */
run('http://test:test@127.0.0.1:12581', 128, 2, 0.1).then()

// Run test
$ node bench.js 
start prepare
valid UTXO number: 1
generated UTXO number: 1
...
```