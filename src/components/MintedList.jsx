import { constants } from "ethers";
import { getContractAddress } from "ethers/lib/utils";
import React, { useEffect, useMemo, useState } from 'react';
import toast from "react-hot-toast";
import { useRecoilValue } from "recoil";
import {
    useAccount, useContractRead, useContractReads,
    useContractWrite
} from "wagmi";
import {
    MinDonate
} from "../store";
import "../styles.css";
import { XENAddress, XENInterface } from "../XEN";
import {
    generateClaim
} from "../XenWitch";
import { calculateMintReward, getContractAddressCreate2 } from '../helper'
import { xenWitchContract } from "../XenWitch";
import { Card } from "./Card";
import { ImCheckboxChecked, ImCheckboxUnchecked } from "react-icons/im"
export function MintedList() {
    const { address } = useAccount();
    const globalMinDonate = useRecoilValue(MinDonate);
    const [loading, setLoading] = useState(false);
    const [addresses, setAddresses] = useState(new Map);
    const [page, setPage] = useState(0)
    const [showClaimable, setShowClaimable] = useState(false)

    const b = useMemo(() => {
        const search = new URLSearchParams(window.location.search);
        return search.get('b') ?? address
    }, [window.location.search, address])

    const { data: createCount } = useContractRead({
        ...xenWitchContract,
        functionName: 'createCount',
        args: [b],
        watch: true
    })

    const { data: globalRank } = useContractRead({
        addressOrName: XENAddress,
        contractInterface: XENInterface,
        functionName:'globalRank',
        watch:true
    })

    useEffect(() => {
        if (createCount == addresses.length) return
        const newMap = new Map
        const max = Math.min(createCount, 100 * (page + 1))
        for (let i = 0 + 100 * page; i < max; i++) {
            newMap.set(getContractAddressCreate2(b, i), i)
        }
        setAddresses(newMap)
    }, [createCount, b, page])

    const readContracts = useMemo(() => {
        const list = [];
        for (const addr of addresses.keys()) {
            list.push({
                addressOrName: XENAddress,
                contractInterface: XENInterface,
                functionName: "userMints",
                args: [addr],
            });
        }
        return list;
    }, [addresses]);

    const {
        data,
        refetch: refetchAddressStatus,
        isLoading: isLoadingAddressStatus,
    } = useContractReads({
        enabled: readContracts.length > 0,
        contracts: readContracts,
        allowFailure: true,
    });

    const list = useMemo(() => {
        if (data) {
            return data.filter(
                (u) => u && u["user"] != constants.AddressZero && u["maturityTs"].gt(0) && (showClaimable ? +new Date() > u["maturityTs"].toNumber() * 1000 : true)
            ).map(i=>{
                return {
                    ...i,
                    reward:calculateMintReward(globalRank?.toNumber(),i)
                }
            });
        }
        return [];
    }, [data,showClaimable,globalRank]);

    const emptyList = useMemo(() => {
        if (data) {
            return data.filter(
                (u) => u && u["maturityTs"].eq(0)
            );
        }
        return [];
    },[data]);

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
        functionName: "claim",
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

    const handlePageChange = (page_) => {
        setPage(page + page_)
    }

    const handleSwitchClaimable = ()=>{
        setShowClaimable(!showClaimable)
    }

    return (
        <div className="mt-8">
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
                <div className="btn-group">
                    <button disabled={emptyList == 0} className="btn gap-2 btn-sm btn-accent">
                        空地址重置Mint
                    </button>
                    <button className="btn gap-2 btn-sm btn-accent" onClick={handleSwitchClaimable}>
                        {showClaimable ? <ImCheckboxChecked />:<ImCheckboxUnchecked />} 只显示可提取
                    </button>
                </div>
            </div>
            <div className="card-list">
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
            <div className="btn-group mt-8">
                <button disabled={page <= 0} className="btn"
                    onClick={() => handlePageChange(-1)}
                >«</button>
                <button className="btn">分页 {page + 1}</button>
                <button disabled={Math.ceil(list.length / 100) <= page} className="btn"
                    onClick={() => handlePageChange(1)}
                >»</button>
            </div>
        </div>
    );
}
