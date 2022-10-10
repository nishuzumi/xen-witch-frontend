import { utils } from "ethers";
import { keccak256, solidityPack } from "ethers/lib/utils";

const CACreationCode = [
  "0x3d602d80600a3d3981f3363d3d373d3d3d363d73",
  "DaA6A0dAF1179780698e63671C0b23E8e344562A".toLowerCase(),
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

export const contractAddress = "0xDF024061Cf701c02Db0E2Df32F160F12a660a396";
export const notification = {
  insert: "top",
  container: "top-right",
  animationIn: ["animate__animated animate__fadeIn"], // `animate.css v4` classes
  animationOut: ["animate__animated animate__fadeOut"], // `animate.css v4` classes
};
