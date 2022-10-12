import { utils } from "ethers";
import { getAddress, keccak256, solidityPack } from "ethers/lib/utils";
import { XenWitchInterface, contractAddress } from "./XenWitch";


const CACreationCode = '0x3d602980600a3d3981f3363d3d373d3d3d363d6fc34eF4698F3647f8c65696796d4500955af43d82803e903d91602757fd5bf3'
export const getContractAddressCreate2 = (address, count) => {
  return utils.getAddress(
    `0x${keccak256(
      `0x${[
        "ff",
        contractAddress,
        keccak256(solidityPack(["address", "uint32"], [address, count])),
        keccak256(CACreationCode),
      ]
        .map((x) => x.replace(/0x/, ""))
        .join("")}`
    ).slice(-40)}`
  );
}
