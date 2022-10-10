import { ConnectButton } from "@rainbow-me/rainbowkit";
import "./styles.css";
import {
  addressesSearcher,
  contractAddress,
  getContractAddress,
  notification,
} from "./helper";
import "@rainbow-me/rainbowkit/styles.css";
import {
  generateMint,
  XenWitchInterface,
  generateOneClaim,
  generateClaim,
} from "./XenWitch";
import { XENAddress, XENInterface } from "./XEN";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { ReactNotifications, Store } from "react-notifications-component";
import "react-notifications-component/dist/theme.css";
import "animate.css/animate.min.css";
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
import { constants, ethers } from "ethers";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { RecoilRoot, useRecoilState, useRecoilValue } from "recoil";
import {
  GlobalAddresses,
  GlobalAddressList,
  GlobalXENs,
  MinDonate,
} from "./store";
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
      <RainbowKitProvider chains={chains}>
        <RecoilRoot>
          <ReactNotifications />
          <Page />
        </RecoilRoot>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

const xenWitchContract = {
  addressOrName: contractAddress,
  contractInterface: XenWitchInterface,
};

function Card(props) {
  const { userInfo, id } = props;

  const { writeAsync } = useContractWrite({
    ...xenWitchContract,
    functionName: "callAll",
    args: [generateClaim(id)],
    onError: (err) => {
      Store.addNotification({
        ...notification,
        title: "错误",
        message: err?.error?.message,
        type: "danger",
      });
    },
  });

  const handleClaimed = () => {
    if (+new Date() < userInfo["maturityTs"].toNumber() * 1000) return;
    writeAsync().then(() => {
      alert("✅ Tx Sended！");
    });
  };
  return (
    <div key={id} className="card">
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
  const globalAddresses = useRecoilValue(GlobalAddresses);
  const globalMinDonate = useRecoilValue(MinDonate);

  const readContracts = useMemo(() => {
    const list = [];
    for (const addr of globalAddresses.keys()) {
      list.push({
        addressOrName: XENAddress,
        contractInterface: XENInterface,
        functionName: "userMints",
        args: [addr],
      });
    }
    return list;
  }, [globalAddresses]);

  const { data } = useContractReads({
    enabled: readContracts.length > 0,
    contracts: readContracts,
    allowFailure: true,
  });

  const list = useMemo(() => {
    if (data) {
      return data.filter(
        (u) => u && u["user"] != constants.AddressZero && u["maturityTs"].gt(0)
      );
    }
    return [];
  }, [data]);

  const claimAllData = useMemo(() => {
    const now = +new Date();
    const ids = list
      .filter((info) => {
        return info["maturityTs"].toNumber() * 1000 < now;
      })
      .map((i) => globalAddresses.get(i["user"]));
    return generateClaim(ids);
  }, [list]);
  const canOneClick = useMemo(() => {
    return claimAllData.length > 0;
  }, [claimAllData]);
  const { writeAsync } = useContractWrite({
    ...xenWitchContract,
    functionName: "callAll",
    args: [claimAllData],
    overrides: {
      value: globalMinDonate,
    },
    onError: (err) => {
      Store.addNotification({
        ...notification,
        title: "错误",
        message: err?.error?.message,
        type: "danger",
      });
    },
  });

  const handleOneClick = () => {
    writeAsync().then((tx) => {
      Store.addNotification({
        ...notification,
        title: "交易发送成功",
        message: `hash: ${tx.hash}`,
      });
    });
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
        }}
      >
        <button disabled={!canOneClick} onClick={handleOneClick}>
          批量提取奖励
        </button>
      </div>
      <div className="card-list">
        {data
          ? list.map((userInfo) => (
              <Card
                key={userInfo["user"]}
                userInfo={userInfo}
                id={globalAddresses.get(userInfo["user"])}
              />
            ))
          : ""}
      </div>
    </div>
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
    addressesSearcher(address, provider).then((addresses) => {
      setGlobalAddress(addresses);
      setLoading(false);
    });
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
      Store.addNotification({
        ...notification,
        title: "错误",
        message: err?.error?.message,
        type: "danger",
      });
    },
  });

  const hanldeMint = async () => {
    if (createCount.toNumber() > 5000) {
      Store.addNotification({
        ...notification,
        title: "错误",
        message: "达到5000上限或数据错误，推荐更换地址",
      });
      return;
    }
    writeAsync().then(() => {
      alert("✅ Tx sended!");
    });
  };

  const disableMint = useMemo(() => {
    return isLoading;
  }, [isLoading]);

  const allReady = useMemo(() => {
    return minDonate !== undefined && address && contract && !loading;
  }, [minDonate, contract, address, loading]);
  return (
    <div className="App">
      <div className="big-text">https://twitter.com/BoxMrChen</div>
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
          @SafeHouseDAO的discord
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
      <br />
      <div className="center">
        <ConnectButton />
      </div>
      <br />
      {loading ? "加载中，请稍等……" : ""}
      {allReady ? (
        <div>
          <div className="bd">
            数量 -- (amount):
            <input
              type="number"
              value={amount}
              onChange={handleSetAmount}
              onBlur={handleBlurAmount}
            />
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
            <button disabled={disableMint} onClick={hanldeMint}>
              进行批量Mint攻击 (Witch Mint)
            </button>
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
