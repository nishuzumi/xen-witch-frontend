import { utils } from "ethers";
import { keccak256, solidityPack } from "ethers/lib/utils";

const CACreationCode = [
  "0x3d602d80600a3d3981f3363d3d373d3d3d363d73",
  "f42A4A7E31008DB2DFD6a7fC4E9b9cF8C62d45cF".toLowerCase(),
  "5af43d82803e903d91602b57fd5bf3",
].join("");
export function getContractAddress(address, count) {
  return utils.getAddress(
    `0x${keccak256(
      `0x${[
        "ff",
        contractAddress,
        keccak256(solidityPack(["address", "uint256"], [address, count])),
        keccak256(CACreationCode),
      ]
        .map((x) => x.replace(/0x/, ""))
        .join("")}`
    ).slice(-40)}`
  );
}

export const contractAddress = "0x758d135f940189A7a06265e3827ED104d91D1646";
