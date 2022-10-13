import React from 'react';
import toast from 'react-hot-toast';
import { useRecoilValue } from 'recoil';
import {
    useAccount, useContractWrite
} from "wagmi";
import { useXenWitchContract, useXenWitchOp } from '../hooks/useXenWitchContract';
import { MinDonate } from '../store';
import "../styles.css";

export function Card(props) {
    const { address } = useAccount();
    const { userInfo, id } = props;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("a") ?? "0x6E12A28086548B11dfcc20c75440E0B3c10721f5";
    const globalMinDonate = useRecoilValue(MinDonate)
    const xenWitchContract = useXenWitchContract()
    const [_,functionClaim] = useXenWitchOp()

    const { writeAsync } = useContractWrite({
        ...xenWitchContract,
        functionName: functionClaim,
        args: [[id]],
        mode: "recklesslyUnprepared",
        overrides:{
            value: globalMinDonate
        },
        onError: (err) => {
            toast.error(err?.error?.message ?? err?.message)
        },
    });

    const handleClaimed = () => {
        if (+new Date() < userInfo["maturityTs"].toNumber() * 1000) return;
        writeAsync().then((tx) => {
            toast.success(`成功! ${tx.hash}`)
        });
    };
    return (
        <div key={id} className="address-card card-2 bg-gray-100 p-4 rounded-md">
            <div className='badge'>
                {`${userInfo["user"].slice(0, 6)}...${userInfo["user"].slice(-4)}`}
            </div>
            <div >
                {new Date(userInfo["maturityTs"].toNumber() * 1000).toLocaleString()}
            </div>
            <div >
                预计 <span className='badge'>{`${userInfo['reward'].toLocaleString("en-US",{maximumFractionDigits:0})}`}</span> ETH
            </div>
            <div>
                <button
                    className='btn btn-sm mt-2'
                    disabled={+new Date() < userInfo["maturityTs"].toNumber() * 1000}
                    onClick={handleClaimed}
                >
                    领取奖励
                </button>
            </div>
        </div>
    );
}
