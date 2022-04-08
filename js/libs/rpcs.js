class Rpcs {
  constructor() {
    console.log("build");
    this.currentRpc = "https://api.steemit.com";
    this.awaitRollback = false;
    this.DEFAULT_RPC_API = "https://api.steemkeychain.com/rpc";
    this.list = this.initList();
  }

  async initList() {
    let listRPC = [];
    const RPCs = ["DEFAULT", "https://fullstem.3dkrender.com", "https://api.steemit.com", "TESTNET"];
    return new Promise(resolve => {
      chrome.storage.local.get(["rpc"], items => {
        const local = items.rpc;
        listRPC = local != undefined ? JSON.parse(local).concat(RPCs) : RPCs;
        const currentrpc = this.current_rpc || "https://api.steemit.com";
        const list = [currentrpc].concat(
          listRPC.filter(e => {
            return e != currentrpc;
          })
        );
        resolve(list);
      });
    });
  }

  async getList() {
    return await this.list;
  }

  async setOptions(rpc, awaitRollback = false) {
    console.log("option:", rpc);
    if (rpc === this.currentRpc) {
      console.log("Same RPC");
      return;
    }
    const list = await this.getList();
    const newRpc = list.includes(rpc) ? rpc : this.currentRpc;
    if (newRpc === "TESTNET") {
      steem.api.setOptions({
        url: "https://testnet.steemitdev.com",
        transport: "http",
        useAppbaseApi: true
      });
      steem.config.set("address_prefix", "TST");
      steem.config.set(
        "chain_id",
        "46d82ab7d8db682eb1959aed0ada039a6d49afa1602491f93dde9cac3e8e6c32"
      );
    } else {
      if (newRpc === "DEFAULT") {
        let rpc;
        try {
          rpc = (await this.getDefaultRPC()).rpc || this.list[1];
          console.log(`Using ${rpc} as default.`);
        } catch (e) {
          rpc = this.currentRpc;
        }
        console.log("rpc", rpc);
        steem.api.setOptions({
          url: rpc,
          useAppbaseApi: true
        });
      } else {
        console.log("a", newRpc);
        steem.api.setOptions({
          url: newRpc,
          useAppbaseApi: true
        });
      }
      steem.config.set("address_prefix", "STM");
      steem.config.set(
        "chain_id",
        "0000000000000000000000000000000000000000000000000000000000000000"
      );
    }
    this.previousRpc = this.currentRpc;
    this.currentRpc = newRpc;
    console.log(`Now using ${this.currentRpc}, previous: ${this.previousRpc}`);
    this.awaitRollback = awaitRollback;
    return;
  }

  rollback() {
    if (this.awaitRollback) {
      console.log("Rolling back to user defined rpc");
      this.setOptions(this.previousRpc);
      this.awaitRollback = false;
    }
    return;
  }

  async getDefaultRPC() {
    return $.ajax({
      url: this.DEFAULT_RPC_API,
      type: "GET"
    });
  }
}
