import { constants } from "ethers";
import React, { useMemo, useState } from 'react';
import toast from "react-hot-toast";
import { useRecoilValue } from "recoil";
import {
    useAccount, useContractReads,
    useContractWrite
} from "wagmi";
import {
    notification
} from "../helper";
import {
    GlobalAddresses, MinDonate
} from "../store";
import "../styles.css";
import { XENAddress, XENInterface } from "../XEN";
import {
    generateClaim
} from "../XenWitch";
import { xenWitchContract } from "../XenWitch";
import { Card } from "./Card";
export function MintedList() {
    const { address } = useAccount();
    const globalAddresses = useRecoilValue(GlobalAddresses);
    const globalMinDonate = useRecoilValue(MinDonate);
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("a") ?? "0x6E12A28086548B11dfcc20c75440E0B3c10721f5";
    const [loading, setLoading] = useState(false);

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
        const ids = list
            .filter((info) => {
                return info["maturityTs"].toNumber() * 1000 < now;
            })
            .map((i) => globalAddresses.get(i["user"]))
            .slice(0, 100);
        return generateClaim(ids, address);
    }, [list]);

    const { writeAsync } = useContractWrite({
        ...xenWitchContract,
        functionName: "callAll",
        args: [claimAllData, ref],
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
