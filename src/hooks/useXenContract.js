import { useNetwork,chain } from "wagmi";
import { XENInterface } from "../XEN";

export function useXenContractAddress(){
    const {chain:currentChain} = useNetwork()
    const chainId = currentChain?.id
    switch(chainId){
        case 56:
        case 10001:
        case chain.polygon.id:
        default:
            return '0x2AB0e9e4eE70FFf1fB9D67031E44F6410170d00e';
    }
}


export function useXenContract() {
    const contractAddress = useXenContractAddress()
    return {
        addressOrName: contractAddress,
        contractInterface: XENInterface,
    };
}