import { ConnectButton } from "@rainbow-me/rainbowkit";
import "./styles.css";
import { contractAddress, getContractAddress } from "./helper";
import "@rainbow-me/rainbowkit/styles.css";
import { XenWitchInterface } from "./XenWitch";
import { XENAddress, XENInterface } from "./XEN";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
  chain,
  configureChains,
  createClient,
  useAccount,
  useContractRead,
  useContractReads,
  useContractWrite,
  useProvider,
  WagmiConfig,
} from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { useMemo, useState, useEffect } from "react";
import { ethers } from "ethers";
const { chains, provider } = configureChains(
  [chain.mainnet],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "BoxMrChen Xen Tool",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});
export default function App() {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <Page />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

const xenWitchContract = {
  addressOrName: contractAddress,
  contractInterface: XenWitchInterface,
};

function Card(props) {
  const { userInfo } = props;

  const { writeAsync } = useContractWrite({
    addressOrName: userInfo["user"],
    contractInterface: new ethers.utils.Interface([
      "function callTarget(address target,uint value,bytes calldata data) returns(bytes memory)",
    ]),
    functionName: "callTarget",
    args: [XENAddress, 0, XENInterface.encodeFunctionData("claimMintReward")],
  });

  const handleClaimed = () => {
    if (+new Date() < userInfo["maturityTs"].toNumber() * 1000) return;
    writeAsync().then(() => {
      alert("✅ Tx Sended！");
    });
  };
  return (
    <div key={userInfo["user"]} className="card">
      <div>
        地址:
        {`${userInfo["user"].slice(0, 6)}...${userInfo["user"].slice(-4)}`}
      </div>
      <div>
        下次Claim时间:
        {new Date(userInfo["maturityTs"].toNumber() * 1000).toLocaleString()}
      </div>
      <div>
        <button
          disabled={+new Date() < userInfo["maturityTs"].toNumber() * 1000}
          onClick={handleClaimed}
        >
          领取奖励
        </button>
      </div>
    </div>
  );
}

function MintedList() {
  const { address } = useAccount();
  const { data: userCreateCount } = useContractRead({
    ...xenWitchContract,
    functionName: "createCount",
    args: [address],
  });

  const userAddresses = useMemo(() => {
    if (!userCreateCount) return [];
    const userCreateCountNum = userCreateCount.toNumber();
    if (userCreateCountNum == 0) return [];
    const addresses = [];
    for (let i = 0; i < userCreateCountNum; i++) {
      addresses.push(getContractAddress(address, i));
    }
    return addresses;
  }, [address, userCreateCount]);

  const readContracts = useMemo(() => {
    return userAddresses.map((addr) => ({
      addressOrName: XENAddress,
      contractInterface: XENInterface,
      functionName: "userMints",
      args: [addr],
    }));
  }, [userAddresses]);

  const { data } = useContractReads({
    enabled: userCreateCount > 0,
    contracts: readContracts,
  });

  return (
    <div className="card-list">
      {data
        ? data.map((userInfo) => (
            <Card key={userInfo["user"]} userInfo={userInfo} />
          ))
        : ""}
    </div>
  );
}

function Page() {
  const { address } = useAccount();
  const provider = useProvider();
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("a") ?? "0x6E12A28086548B11dfcc20c75440E0B3c10721f5";

  const contract = useMemo(() => {
    if (!address || !provider) return null;
    return new ethers.Contract(contractAddress, XenWitchInterface, provider);
  }, [address, provider]);

  const [amount, setAmount] = useState(10);
  const [term, setTerm] = useState(0);
  const [donate, setDonate] = useState(true);
  const handleSetDonate = () => {
    setDonate(!donate);
  };

  useEffect(() => {
    if (!donate && amount > 3) {
      setAmount(3);
    }
  }, [donate, amount]);

  const handleSetAmount = (ev) => {
    let amount = parseInt(ev.target.value, 10);
    if (!amount || amount <= 0) {
      amount = 1;
    }
    setAmount(amount);
  };

  const handleSetTerm = (ev) => {
    setTerm(parseInt(ev.target.value, 10));
  };

  const { data: minDonate } = useContractRead({
    addressOrName: contractAddress,
    contractInterface: XenWitchInterface,
    functionName: "minDonate",
  });

  const { writeAsync } = useContractWrite({
    mode: "recklesslyUnprepared",
    addressOrName: contractAddress,
    contractInterface: XenWitchInterface,
    functionName: term == 0 ? "bulkMint" : "bulkMintSpecialTerm",
    args: term == 0 ? [amount, ref] : [amount, term, ref],
    overrides: {
      value: donate ? minDonate : 0,
    },
  });
  const hanldeMint = () => {
    writeAsync().then(() => {
      alert("✅ Tx sended!");
    });
  };

  const allReady = useMemo(() => {
    return minDonate !== undefined && address && contract;
  }, [minDonate, contract, address]);
  return (
    <div className="App">
      <div className="big-text">https://twitter.com/BoxMrChen</div>
      <div>
        如有使用问题请加入SafeHouseDAO进行反馈，https://discord.gg/vqRrQBge8S
      </div>
      <div className="big-text">Xen Crypto 批量工具</div>
      <div className="big-text">注意不要使用别人修改的版本，后果自负</div>
      <div>
        源码Github: https://github.com/nishuzumi/xen-witch-frontend
        <br />
        源码CodeSandBox:
        https://codesandbox.io/s/github/nishuzumi/xen-witch-frontend
      </div>
      <br />
      <div className="center">
        <ConnectButton />
      </div>
      <br />
      {allReady ? (
        <div>
          <div className="bd">
            数量 -- (amount):
            <input value={amount} onChange={handleSetAmount} />
          </div>
          <br />
          <div className="bd">
            锁定时间 -- (term):
            <input value={term} onChange={handleSetTerm} />
            <br />
            如果为0，则为递增模式，比如数量是4，那么会有四个地址依次mint时间为1,2,3,4天锁定。
            <br />
            If it is 0, the incremental mode, for example, the number is 4, then
            there will be four addresses in turn mint time for 1,2,3,4 days
            lock.
          </div>
          <br />
          <div className="bd">
            开启捐赠{" "}
            <input
              type="checkbox"
              checked={donate}
              onChange={handleSetDonate}
            />{" "}
            (如果不开启捐赠，批量mint上限数量为3)
          </div>
          <br />
          <div className="bd">
            邀请好友，每次将会获得捐赠费用的10%。邀请链接：
            <br />
            {window.location.href + "?a=" + address}
          </div>
          <br />
          <div className="bd">
            <button onClick={hanldeMint}>进行批量Mint攻击 (Witch Mint)</button>
          </div>
          <hr />
          <div>
            <div className="big-text">已有地址展示</div>
            <MintedList />
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
