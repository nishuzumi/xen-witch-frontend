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
import { getContractAddressCreate2} from '../helper'
import { xenWitchContract } from "../XenWitch";
import { Card } from "./Card";
export function MintedList() {
    const { address } = useAccount();
    const globalMinDonate = useRecoilValue(MinDonate);
    const [loading, setLoading] = useState(false);
    const [addresses, setAddresses] = useState(new Map);
    const { data: createCount } = useContractRead({
        ...xenWitchContract,
        functionName: 'createCount',
        args: [address],
        watch: true
    })

    useEffect(() => {
        if (createCount == addresses.length) return
        const newMap = new Map
        for (let i = 0; i < createCount; i++) {
            newMap.set(getContractAddressCreate2(address, i), i)
        }
        setAddresses(newMap)
    }, [createCount, address])

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
                (u) => u && u["user"] != constants.AddressZero && u["maturityTs"].gt(0)
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

    return (
        <div>
            <div
                style={{
                    display: "flex",
                }}
            >
                <button disabled={!canOneClick} className='btn btn-primary btn-sm' onClick={handleOneClick}>
                    批量提取奖励
                </button>
            </div>
            <div className="card-list">
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
