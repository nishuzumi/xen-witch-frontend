import { useState,useEffect,useMemo } from "react";
import { useContractRead,useContractReads } from "wagmi";
import { getContractAddressCreate2 } from "../helper";
import { XENInterface } from "../XEN";
import { useXenWitchContract } from "./useXenWitchContract";
import {useXenContractAddress} from "./useXenContract";
import { useRecoilValue } from "recoil";
import { MinDonate } from "../store";
export function useMintedList(b){
    const [addresses, setAddresses] = useState(new Map);
    const xenWitchContract = useXenWitchContract()
    const XENAddress = useXenContractAddress()
    const { data: createCount } = useContractRead({
        ...xenWitchContract,
        functionName: 'createCount',
        args: [b],
        watch: true
    })


    useEffect(() => {
        if (createCount == addresses.length) return
        const newMap = new Map
        for (let i = 0; i < createCount; i++) {
            newMap.set(getContractAddressCreate2(xenWitchContract.addressOrName, b, i), i)
        }
        setAddresses(newMap)
    }, [createCount, b])

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
        select:(data)=>{
            return data.map((item,index)=>{
                return {
                    ...item,
                    id:index
                }
            })
        }
    });

    return {addresses,data,refetchAddressStatus,isLoadingAddressStatus}
}