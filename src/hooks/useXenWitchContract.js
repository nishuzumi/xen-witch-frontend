import { ethers } from "ethers";
import { useNetwork, chain } from "wagmi";
import { XenWichABIPolygon, XenWitchABI } from "../XenWitch";

export function useXenWitchContractAddress() {
    const { chain: currentChain } = useNetwork()
    const chainId = currentChain?.id
    switch (chainId) {
        case 56:
            return '0xeED210f13C6aeBF3aF2f80377C73A9e60f14BeEc'
        case 10001:
        case chain.polygon.id:
            return '0x00000000c34eF4698F3647f8c65696796d450095';
        default:
            return undefined;
    }
}

export function useXenWitchContract() {
    const { chain: currentChain } = useNetwork()
    const chainId = currentChain?.id
    const contractAddress = useXenWitchContractAddress()
    let contractInterface
    switch (chainId) {
        case 56:
            contractInterface = XenWitchABI
            break
        case 10001:
        case chain.polygon.id:
            contractInterface = XenWichABIPolygon
            break
        default:
            undefined
    }
    if (!contractInterface) {
        return {}
    }
    return {
        addressOrName: contractAddress,
        contractInterface: new ethers.utils.Interface(contractInterface),
    };
}

export function useXenWitchOp() {
    const { chain: currentChain } = useNetwork()
    const chainId = currentChain?.id
    switch (chainId) {
        case 56:
            return ['mint', 'claim', 'callAll']
        case 10001:
        case chain.polygon.id:
            return ['mintAll', 'claimAll', 'callAll']
        default:
            return []
    }
}