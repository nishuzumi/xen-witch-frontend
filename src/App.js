import { ConnectButton } from "@rainbow-me/rainbowkit";
import "./styles.css";
import "@rainbow-me/rainbowkit/styles.css";
import { XenWitchInterface } from "./XenWitch";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
  chain,
  configureChains,
  createClient,
  useAccount,
  useContractRead,
  useProvider,
  WagmiConfig,
} from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { useMemo, useState } from "react";
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

const contractAddress = "0x758d135f940189A7a06265e3827ED104d91D1646";

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

  const handleSetAmount = (ev) => {
    setAmount(ev.target.value);
  };

  const handleSetTerm = (ev) => {
    setTerm(ev.target.value);
  };

  const { data } = useContractRead({
    addressOrName: contractAddress,
    contractInterface: XenWitchInterface,
    functionName: "minDonate",
  });

  const allReady = useMemo(() => {
    console.log(data);
    return data !== undefined && address && contract;
  }, [data, contract, address]);
  return (
    <div className="App">
      <div className="big-text">https://twitter.com/BoxMrChen</div>
      <div className="big-text">Xen Crypto 批量工具</div>
      <div className="big-text">Xen Crypto Bulk Mint Tool</div>
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
            开启捐赠 <input type="checkbox" checked={true} />{" "}
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
            <button>进行批量Mint攻击 (Witch Mint)</button>
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
