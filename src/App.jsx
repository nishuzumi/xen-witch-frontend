import { ConnectButton, getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { ethers } from "ethers";
import React, { useEffect, useMemo, useState } from 'react';
import toast, { Toaster } from "react-hot-toast";
import { RecoilRoot, useRecoilState } from "recoil";
import { useNumber } from 'react-use';
import {
  chain,
  configureChains,
  createClient,
  useAccount,
  useContractRead, useContractWrite,
  useNetwork,
  useProvider,
  WagmiConfig
} from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { MintedList } from "./components/MintedList";
import { useXenWitchContract, useXenWitchOp } from "./hooks/useXenWitchContract";
import { MinDonate } from "./store";
import "./styles.css";
Sentry.init({
  dsn: "https://d38b7dabe1124072b80f43425919d13c@o4503958384934912.ingest.sentry.io/4503969987100672",
  integrations: [new BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

const { chains, provider } = configureChains(
  [chain.polygon, {
    id: 56,
    name: 'BSC',
    rpcUrls: {
      default: 'https://bsc-dataseed.binance.org/'
    },
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    blockExplorerUrls: ['https://bscscan.com/'],
    multicall: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 15921452
    }
  }, {
    id: 10001,
    name: 'ETHW',
    rpcUrls: {
      default: 'https://mainnet.ethereumpow.org'
    },
    nativeCurrency: {
      name: 'ETHW',
      symbol: 'ETHW',
      decimals: 18
    },
    blockExplorerUrls: ['https://mainnet.ethwscan.com'],
    multicall: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 14353601
    }
  },
    // {
    //   id: 43114,
    //   name: 'AVAX',
    //   rpcUrls: {
    //     default: 'https://api.avax.network/ext/bc/C/rpc'
    //   },
    //   nativeCurrency: {
    //     name: 'Avalanche',
    //     symbol: 'AVAX',
    //     decimals: 18
    //   },
    //   blockExplorerUrls: ['https://snowtrace.io'],
    //   multicall: {
    //     address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    //     blockCreated: 14353601
    //   }
    // }
  ],
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
        <RecoilRoot>
          <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
          <Page />
        </RecoilRoot>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}


function Page() {
  const { address } = useAccount();
  const { chain } = useNetwork()
  const provider = useProvider();
  const [__, setGlobalMinDonate] = useRecoilState(MinDonate);
  const { addressOrName: contractAddress, contractInterface: XenWitchInterface } = useXenWitchContract()
  const [functionMint, , functionCallAll] = useXenWitchOp()
  const [startTerm, { set: setStartTerm }] = useNumber(1, null, 1)


  const contract = useMemo(() => {
    if (!address || !provider || !XenWitchInterface) return null;
    return new ethers.Contract(contractAddress, XenWitchInterface, provider);
  }, [address, provider, XenWitchInterface]);

  const [amount, setAmount] = useState(10);
  const [term, setTerm] = useState(1);

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
    if (chain?.id !== 56 && chain?.id !== 137) {
      setGlobalMinDonate(0)
    } else {
      setGlobalMinDonate(minDonate.toString());
    }
  }, [minDonate]);

  const { writeAsync } = useContractWrite({
    enable: term != 0,
    mode: "recklesslyUnprepared",
    addressOrName: contractAddress,
    contractInterface: XenWitchInterface,
    functionName: functionMint,
    args: [amount, term],
  });

  const { writeAsync: writeAsyncTermZero } = useContractWrite({
    enable: term == 0,
    mode: "recklesslyUnprepared",
    addressOrName: contractAddress,
    contractInterface: XenWitchInterface,
    functionName: functionCallAll,
  });

  const hanldeMint = async () => {
    if (term == 0) {
      writeAsync(overrides).then(() => {
        toast.success("已提交");
      }).catch((err) => {
        toast.error(err?.error?.message ?? err?.message + '\n' + err?.data?.message)
      });
    } else {
      let start = Number.isNaN(startTerm) ? 1 : startTerm
      data = list.map(item => {
        return {
          id: item.id,
          value: 0,
          to: xenContract.addressOrName,
          data: xenContract.contractInterface.encodeFunctionData('claimRank', [start])
        }
      })

      writeAsyncTermZero({
        recklesslySetUnpreparedArgs: [data]
      }).then(async (tx) => {
        toast.success("已提交");
        return tx.wait()
      }).catch(err => {
        toast.error(err?.error?.message ?? err?.message)
      })
    }

  };

  const allReady = useMemo(() => {
    return minDonate !== undefined && address && contract;
  }, [minDonate, contract, address]);
  return (
    <div className="App bg-base-300 pb-12">
      <div className="navbar bg-base-100 mb-4 justify-between">
        <div><a className="btn btn-ghost normal-case text-xl whitespace-pre-wrap">XEN Tool</a></div>
        <div><ConnectButton /></div>
      </div>
      <div className="container mx-auto">
        <div className="card bg-base-100 shadow-xl p-4 flex-1 mb-4" style={{ display: 'block' }}>
          此版本为
          <div className="badge badge-ghost" style={{ backgroundColor: 'orange' }}>BSC</div>
          <div className="badge badge-ghost" style={{ backgroundColor: 'purple', color: '#fff' }}>Polygon</div>
          <div className="badge badge-ghost" style={{ backgroundColor: 'blue', color: '#fff' }}>ETHW</div>
          版本，
          <div className="badge badge-info" >ETH</div> 请使用<a href="https://xen.web3box.dev" className="link"> https://xen.web3box.dev</a>
        </div>
        <div className="flex gap-4 md:flex-nowrap flex-wrap">
          {allReady && <div className='card shadow-xl p-4 md:max-w-xs w-full items-center'>
            <div className="form-control max-w-xs w-full">
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
            {term == 0 && <div className="form-control w-full ">
              <label className="label">
                <span className="label-text">起始时间点</span>
                <span className="label-text-alt">天数</span>
              </label>
              <input type="number" min={1} className="input input-bordered w-full  input-sm" onChange={(e) => setStartTerm(parseInt(e.target.value, 10))} value={startTerm} />
            </div>}
            <div className="divider" />
            <div className="form-control w-full max-w-xs">
              <button onClick={hanldeMint} className='btn btn-primary'>
                进行批量Mint攻击 (Witch Mint)
              </button>
            </div>
          </div>}
          <div className="card bg-base-100 shadow-xl p-4 flex-1 justify-center">
            <div className="big-text">
              <a className='link' href="https://twitter.com/BoxMrChen" target='__blank'>https://twitter.com/BoxMrChen</a>
            </div>
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
          </div>
        </div>
        <div className="mt-4">
          {allReady ? (
            <div className="flex flex-wrap gap-8 items-start sm:justify-between justify-center">

              <div className="card flex-1 shadow-xl p-8">
                <div className="text-2xl font-bold">已有地址展示</div>
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
