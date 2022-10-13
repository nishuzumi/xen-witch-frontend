import { Dialog } from '@headlessui/react';
import { constants } from "ethers";
import React, { useMemo, useState } from 'react';
import toast from "react-hot-toast";
import { ImCheckboxChecked, ImCheckboxUnchecked } from "react-icons/im";
import { useRecoilValue } from "recoil";
import {
    useAccount, useContractRead, useContractWrite
} from "wagmi";
import { calculateMintReward } from '../helper';
import { useMintedList } from "../hooks/mintedList";
import { useXenContractAddress } from "../hooks/useXenContract";
import { useXenWitchContract, useXenWitchOp } from "../hooks/useXenWitchContract";
import {
    MinDonate
} from "../store";
import "../styles.css";
import { XENInterface } from "../XEN";
import { Card } from "./Card";

export function MintedList() {
    const { address } = useAccount()
    const globalMinDonate = useRecoilValue(MinDonate);
    const [loading, setLoading] = useState(false);

    const [showClaimable, setShowClaimable] = useState(false)
    const xenWitchContract = useXenWitchContract()
    const XENAddress = useXenContractAddress()
    const [_, functionClaim] = useXenWitchOp()

    const b = useMemo(() => {
        const search = new URLSearchParams(window.location.search);
        return search.get('b') ?? address
    }, [window.location.search, address])

    const { data, isLoadingAddressStatus, refetchAddressStatus, addresses } = useMintedList(b)

    const { data: globalRank } = useContractRead({
        addressOrName: XENAddress,
        contractInterface: XENInterface,
        functionName: 'globalRank',
        watch: true
    })

    const list = useMemo(() => {
        if (data) {
            return data.filter(
                (u) => u && u["user"] != constants.AddressZero && u["maturityTs"].gt(0) && (showClaimable ? +new Date() > u["maturityTs"].toNumber() * 1000 : true)
            ).map(i => {
                return {
                    ...i,
                    reward: calculateMintReward(globalRank?.toNumber(), i)
                }
            });
        }
        return [];
    }, [data, showClaimable, globalRank]);

    const emptyList = useMemo(() => {
        if (data) {
            return data.filter(
                (u) => u && u["maturityTs"].eq(0)
            );
        }
        return [];
    }, [data]);

    const claimAllData = useMemo(() => {
        const now = +new Date();
        return list
            .filter((info) => {
                return info["maturityTs"].toNumber() * 1000 < now;
            })
            .map((i) => addresses.get(i["user"]))
            .slice(0, 100);;
    }, [list]);

    const { writeAsync } = useContractWrite({
        ...xenWitchContract,
        functionName: functionClaim,
        args: [claimAllData],
        overrides: {
            value: globalMinDonate,
        },
        mode: "recklesslyUnprepared",
        onSuccess: (tx) => {
            tx.wait().then(async () => {
                await refetchAddressStatus();
                setLoading(false);
            });
        },
        onError: (err) => {
            toast.error(err?.error?.message ?? err?.message)
        },
    });

    const canOneClick = useMemo(() => {
        return claimAllData.length > 0 && !isLoadingAddressStatus && !loading;
    }, [claimAllData, isLoadingAddressStatus, loading]);

    const handleOneClick = () => {
        setLoading(true);
        writeAsync().then((tx) => {
            toast.success("交易发送成功\n" + `hash: ${tx.hash}`)
        });
    };

    const handleSwitchClaimable = () => {
        setShowClaimable(!showClaimable)
    }

    return (
        <div className="mt-8">
            <input type="checkbox" id="remint-model" className="modal-toggle" />
            <label htmlFor="remint-model" className="modal cursor-pointer">
                <label className="modal-box relative" for="">
                    <h3 className="text-lg font-bold">已有地址重Mint</h3>
                    <p className="py-4">
                        你当前有{emptyList.length}个地址未Mint，点击下方按钮进行Mint。
                        <div className="form-control w-full max-w-xs">
                            <label className="label">
                                <span className="label-text">锁定时间</span>
                                <span className="label-text-alt">天数</span>
                            </label>
                            <input type="number" min={0} className="input input-bordered w-full max-w-xs input-sm" />
                            <label className="label">
                                <span className="label-text">如果为0，则为递增模式，比如数量是4，那么会有四个地址依次mint时间为1,2,3,4天锁定。</span>
                            </label>
                        </div>
                        <div className="divider" />
                        <div className="form-control w-full max-w-xs">
                            <button  className='btn btn-primary'>
                                进行批量Mint攻击 (Witch Mint)
                            </button>
                        </div>
                    </p>
                </label>
            </label>
            <div
                className="flex justify-between"
                style={{
                    display: "flex",
                }}
            >
                <div>
                    <button disabled={!canOneClick} className='btn btn-primary btn-sm' onClick={handleOneClick}>
                        批量提取奖励
                    </button>
                </div>
                <div className="btn-group ">
                    <label htmlFor="remint-model" className="btn gap-2 btn-sm btn-accent text-gray-50">
                        空地址重置Mint
                    </label>
                    <button className="btn gap-2 btn-sm btn-accent text-gray-50" onClick={handleSwitchClaimable}>
                        {showClaimable ? <ImCheckboxChecked /> : <ImCheckboxUnchecked />} 只显示可提取
                    </button>
                </div>
            </div>
            <div className="card-list overflow-scroll" style={{ maxHeight: '800px' }}>
                {isLoadingAddressStatus ? <div className="w-full h-48 flex justify-center items-center">
                    <svg class="animate-spin -ml-1 mr-3 h-10 w-10 text-gray" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div> : ''}
                {list
                    ? list.map((userInfo) => (
                        <Card
                            key={userInfo["user"]}
                            userInfo={userInfo}
                            id={addresses.get(userInfo["user"])}
                        />
                    ))
                    : ""}
            </div>
        </div>
    );
}
