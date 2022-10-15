import React, { useState } from "react"
import toast from "react-hot-toast"
import { useRecoilValue } from "recoil"
import { useContractWrite } from "wagmi"
import { useXenContract } from "../hooks/useXenContract"
import { useXenWitchContract, useXenWitchOp } from "../hooks/useXenWitchContract"
import { MinDonate } from "../store"

export function RemintPanel(props) {
    const { emptyList,refetchAddressStatus } = props
    const [times, setTimes] = useState(1)
    const [term, setTerm] = useState(1)
    const xenWitchContract = useXenWitchContract()
    const globalMinDonate = useRecoilValue(MinDonate)
    const [, , functionCallAll] = useXenWitchOp()
    const xenContract = useXenContract()
    const [mintLoading,setMintLoading] = useState(false)

    const { writeAsync } = useContractWrite({
        mode: "recklesslyUnprepared",
        ...xenWitchContract,
        functionName: functionCallAll,
        overrides: {
            value: globalMinDonate
        },
    })

    const hanldeChangeTimes = (e) => {
        const max =  Math.min(emptyList.length, 500);
        const value = Math.min(Math.max(e.target.value, 1),max)
        setTimes(value)
    }
    const handleChangeTerm = (e) => {
        const value = Math.max(e.target.value, 1)
        setTerm(value)
    }

    const handleMint = () => {
        if (!times || !term) return
        const list = emptyList.slice(0, times)
        const contractData = xenContract.contractInterface.encodeFunctionData('claimRank', [term])
        const data = list.map(item => {
            return {
                id:item.id,
                value: 0,
                to: xenContract.addressOrName,
                data: contractData
            }
        })
        setMintLoading(true)
        writeAsync({
            recklesslySetUnpreparedArgs: [data]
        }).then(async(tx) => tx.wait).catch(err=>{
            toast.error(err?.error?.message ?? err?.message)
            return refetchAddressStatus()
        }).finally(()=>{
            setMintLoading(false)
        })
    }
    return <>
        <input type="checkbox" id="remint-model" className="modal-toggle" />
        <div className="modal">
            <div className="modal-box relative" >
                <label htmlFor="remint-model" className="btn btn-sm btn-circle absolute right-2 top-2" style={{display:mintLoading?'none':''}}>✕</label>
                <h3 className="text-lg font-bold">已有地址重Mint</h3>
                <div className="py-4">
                    你当前有{emptyList.length}个地址未Mint，点击下方按钮进行Mint。
                    <div className="form-control w-full ">
                        <label className="label">
                            <span className="label-text">数量</span>
                            <span className="label-text-alt">需要批量Mint的数量</span>
                        </label>
                        <input
                            type="number"
                            className="input input-bordered w-full input-sm"
                            min={1}
                            onChange={hanldeChangeTimes}
                            max={Math.min(emptyList.length, 100)}
                            value={times}
                        />
                    </div>
                    <div className="form-control w-full ">
                        <label className="label">
                            <span className="label-text">锁定时间</span>
                            <span className="label-text-alt">天数</span>
                        </label>
                        <input type="number" min={1} className="input input-bordered w-full  input-sm" onChange={handleChangeTerm} value={term} />
                    </div>
                    <div className="form-control w-full mt-4">
                        <button className='btn btn-primary' onClick={handleMint}>
                            进行批量Mint攻击 (Witch Mint)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </>
}