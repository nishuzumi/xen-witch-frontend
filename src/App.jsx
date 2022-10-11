import { ConnectButton, darkTheme, getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { ethers } from "ethers";
import React, { useEffect, useMemo, useState } from 'react';
import toast, { Toaster } from "react-hot-toast";
import { RecoilRoot, useRecoilState } from "recoil";
import {
  chain,
  configureChains,
  createClient,
  useAccount,
  useContractRead, useContractWrite,
  useProvider,
  WagmiConfig
} from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { MintedList } from "./components/MintedList";
import {
  addressesSearcher,
  notification
} from "./helper";
import {
  GlobalAddresses, MinDonate
} from "./store";
import "./styles.css";
import {
  generateMint,
  XenWitchInterface,contractAddress
} from "./XenWitch";
import {xenWitchContract} from "./XenWitch";
Sentry.init({
  dsn: "https://f32f07092b144606a75e73caf8265606@o4503958384934912.ingest.sentry.io/4503958397845504",
  integrations: [new BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

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
      <RainbowKitProvider  chains={chains}>
        <RecoilRoot>
          <Toaster position="top-right" toastOptions={{duration:5000}}/>
          <Page />
        </RecoilRoot>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}


function Page() {
  const { address } = useAccount();
  const provider = useProvider();
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("a") ?? "0x6E12A28086548B11dfcc20c75440E0B3c10721f5";
  const [loading, setLoading] = useState(true);
  const [_, setGlobalAddress] = useRecoilState(GlobalAddresses);
  const [__, setGlobalMinDonate] = useRecoilState(MinDonate);

  useEffect(() => {
    if (!address || !provider) return;
    setLoading(true);
    //todo:
    addressesSearcher(params.get("b") ?? address, provider).then(
      (addresses) => {
        setGlobalAddress(addresses);
        setLoading(false);
      }
    );
  }, [address, provider]);

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

  const handleSetAmount = (ev) => {
    let amount = ev.target.value;
    setAmount(amount);
  };

  const handleBlurAmount = (ev) => {
    let amount = parseInt(ev.target.value, 10);
    if (!amount || amount < 1) {
      amount = 1;
    }
    if (!donate && amount > 3) {
      amount = 3;
    }
    setAmount(amount);
  };

  const handleSetTerm = (ev) => {
    let term = parseInt(ev.target.value, 10);
    if (isNaN(term)) term = 0;
    setTerm(term);
  };

  const { data: minDonate } = useContractRead({
    addressOrName: contractAddress,
    contractInterface: XenWitchInterface,
    functionName: "minDonate",
  });

  useEffect(() => {
    if (!minDonate) return;
    setGlobalMinDonate(minDonate.toString());
  }, [minDonate]);

  const { data: createCount, isLoading } = useContractRead({
    ...xenWitchContract,
    functionName: "createCount",
    args: [address],
  });

  const mintData = useMemo(() => {
    if (createCount == undefined) return [];
    let offset = createCount.toNumber() == 0 ? 0 : createCount.toNumber() + 1;
    if (offset > 5000) {
      offset = 5000;
    }
    return generateMint(amount, term, offset);
  }, [amount, term, createCount, isLoading]);

  const { writeAsync } = useContractWrite({
    mode: "recklesslyUnprepared",
    addressOrName: contractAddress,
    contractInterface: XenWitchInterface,
    functionName: "callAll",
    args: [mintData, ref],
    overrides: {
      value: donate ? minDonate : 0,
    },
    onError: (err) => {
      toast.error(err?.error?.message ?? err?.message)
    },
  });

  const hanldeMint = async () => {
    if (createCount.toNumber() > 5000) {
      toast.error("达到5000上限或数据错误，推荐更换地址");
      return;
    }
    writeAsync().then(() => {
      toast.success("已提交");
    });
  };

  const disableMint = useMemo(() => {
    return isLoading;
  }, [isLoading]);

  const allReady = useMemo(() => {
    return minDonate !== undefined && address && contract && !loading;
  }, [minDonate, contract, address, loading]);
  return (
    <div className="App bg-base-300 pb-12">
      <div className="navbar bg-base-100 mb-4 justify-between">
        <div><a className="btn btn-ghost normal-case text-xl whitespace-pre-wrap">XEN Tool</a></div>
        <div><ConnectButton /></div>
      </div>
      <div className="container mx-auto">
        <div className="card bg-base-100 shadow-xl p-4 flex-1">
          <div className="big-text">
            <a className='link' href="https://twitter.com/BoxMrChen" target='__blank'>https://twitter.com/BoxMrChen</a>
          </div>
          <div>
            如有使用问题请加入SafeHouseDAO进行反馈，https://discord.gg/vqRrQBge8S
          </div>
          <div
            style={{
              color: "red",
            }}
          >
            如果你在10月10日
            早上10点前使用过此工具，并且你当时的地址消失不见，说明你是用的是旧版本。
            请到{" "}
            <a href="https://discord.com/invite/vqRrQBge8S">
              <button className="btn btn-link">@SafeHouseDAO</button>
            </a>{" "}
            查看旧版本的地址。
          </div>
          <div className="big-text">Xen Crypto 批量工具</div>
          <div className="big-text">注意不要使用别人修改的版本，后果自负</div>
          <div>
            源码Github: https://github.com/nishuzumi/xen-witch-frontend
            <br />
            源码CodeSandBox:
            https://codesandbox.io/s/github/nishuzumi/xen-witch-frontend
          </div>
        </div>
        <div className="mt-8">
          {loading ? <div className="card p-8">加载中，请稍等……</div> : ""}
          {allReady ? (
            <div className="flex flex-wrap gap-8 items-start sm:justify-between justify-center">
              <div style={{ maxWidth: '360px' }} className='card shadow-xl p-4'>
                <div className="form-control w-full max-w-xs">
                  <label className="label">
                    <span className="label-text">数量</span>
                    <span className="label-text-alt">需要批量Mint的数量</span>
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={handleSetAmount}
                    onBlur={handleBlurAmount}
                    className="input input-bordered w-full max-w-xs input-sm"
                    min={1}
                  />
                </div>
                <br />
                <div className="form-control w-full max-w-xs">
                  <label className="label">
                    <span className="label-text">锁定时间</span>
                    <span className="label-text-alt">天数</span>
                  </label>
                  <input type="number" min={0} value={term} onChange={handleSetTerm} className="input input-bordered w-full max-w-xs input-sm" />
                  <label className="label">
                    <span className="label-text">如果为0，则为递增模式，比如数量是4，那么会有四个地址依次mint时间为1,2,3,4天锁定。</span>
                  </label>
                </div>
                <br />
                <div className="form-control w-full max-w-xs">
                  <label className="label cursor-pointer">
                    <span className="label-text">开启捐赠</span>
                    <input type="checkbox" className="checkbox checkbox-primary" checked={donate}
                      onChange={handleSetDonate} />
                  </label>
                  <label className="label">
                    <span className="label-text">如果不开启捐赠，批量mint上限数量为3</span>
                  </label>
                </div>
                <div class="divider" />
                <div className="form-control w-full max-w-xs text-sm text-gray text-start ">
                  邀请好友，每次将会获得捐赠费用的10%。链接：
                  <div style={{overflowWrap:'anywhere'}}>{window.location.href + "?a=" + address}</div>
                </div>
                <br />
                <div className="form-control w-full max-w-xs">
                  <button disabled={disableMint} onClick={hanldeMint} className='btn btn-primary'>
                    进行批量Mint攻击 (Witch Mint)
                  </button>
                </div>
              </div>
              <div className="card flex-1 shadow-xl p-8">
                <div className="h2">已有地址展示</div>
                <MintedList />
              </div>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
}
